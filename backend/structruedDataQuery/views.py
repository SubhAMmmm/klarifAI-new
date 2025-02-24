# structruedDataQuery/views.py
from venv import logger
from rest_framework.views import APIView
from django.conf import settings


from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings

from langchain.prompts import PromptTemplate
import os
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
import pandas as pd
from dotenv import load_dotenv
import re
import io
from sqlalchemy import create_engine, text
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import google.generativeai as genai

logger = logging.getLogger(__name__)




def get_api_key():
    """Retrieve Google API Key with multiple fallback methods"""
    # Try environment variable first
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        # If not found in .env, raise a clear error
        raise ValueError(
            "No Google API Key found. "
            "Please set GOOGLE_API_KEY in .env file. "
            "You can get an API key from: https://makersuite.google.com/app/apikey"
        )
    
    return api_key



def setup_llm():
    """Initialize Gemini LLM with robust error handling"""
    try:
        # Explicitly configure the API key
        api_key = get_api_key()
        
        # Configure the generative AI library
        genai.configure(api_key=api_key)
        
        # Initialize the LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0,
            google_api_key=api_key,
            convert_system_message_to_human=True
        )
        
        prompt = get_prompt_template()
        return prompt, llm
    
    except Exception as e:
        # Detailed logging of the error
        print(f"LLM Setup Error: {str(e)}")
        
        # Option 1: Raise the error to stop initialization
        raise
        
        # Option 2: Return None to allow fallback mechanism
        # return None, None


def get_prompt_template():
    """Get the prompt template with dynamic schema"""
    template = """
You are an expert SQL query generator for a dynamic database. Given a natural language question, generate the appropriate SQL query based on the following schema:

DATABASE SCHEMA:
{schema}

IMPORTANT RULES FOR SQL QUERY GENERATION:
1. Return ONLY the SQL query without explanations or comments.
2. Use appropriate JOIN clauses for combining tables.
3. If tables have columns with the same name, use aliases for each table.
4. If two columns are identical across tables, merge them into a single column by selecting only one.
5. Use relevant WHERE clauses for filtering and specify join conditions clearly.
6. Include aggregation functions (COUNT, AVG, SUM) when required.
7. Use GROUP BY for aggregated results and ORDER BY for sorting when applicable.
8. Select only needed columns instead of using *.
9. Always limit results to 10 rows unless asked otherwise.
10. Clearly assign aliases to each table and reference all columns with table aliases.
11. Always check the table schema and column names to ensure correct references.
12. For age calculations use: CAST(CAST(JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(CAST(birth_year AS TEXT) || '-01-01') AS INT) / 365 AS INT)
13. Ensure foreign key relationships are correctly used in JOINs.
14. Use aggregation functions with actual columns from the correct table.
15. Use table aliases, but **do not use the 'AS' keyword for aliases** (e.g., `uploaded_data ud` instead of `uploaded_data AS ud`).
16. The SQL query should be able to run in SQLite.
17. most Don't use this format  ```sql ```  only give me the sql query.
18. IMPORTANT: When referencing column names that contain spaces or special characters, always wrap them in double quotes ("). For example: "Hair serums", "Product category"
19. For column names with spaces, use double quotes like this: SELECT "Hair serums" FROM table_name

User Question: {question}

Generate the SQL query that answers this question:
"""
    return PromptTemplate(
        input_variables=["question", "schema"],
        template=template
    )


def generate_result_explanation(results_df, user_question, llm):
    """Generate a clear, concise explanation of query results with key insights."""
    try:
        # Basic dataset info
        row_count = len(results_df)
        if row_count == 0:
            return "### 📊 No Results Found\nThe query returned no data. Please try modifying your search criteria."

        # Analyze numeric and categorical columns
        insights = []
        for column in results_df.columns:
            col_data = results_df[column]
            
            if pd.api.types.is_numeric_dtype(col_data):
                # Only calculate stats if there's non-null numeric data
                if not col_data.isna().all():
                    stats = {
                        'mean': col_data.mean(),
                        'max': col_data.max(),
                        'min': col_data.min()
                    }
                    insights.append(f"- {column}: Range {stats['min']:.2f} to {stats['max']:.2f}, Average {stats['mean']:.2f}")
            else:
                # For categorical columns, show top values and their counts
                value_counts = col_data.value_counts().head(3)
                if not value_counts.empty:
                    top_values = ", ".join(f"{val} ({count})" for val, count in value_counts.items())
                    insights.append(f"- {column}: Most common values: {top_values}")

        # Create analysis prompt
        analysis_prompt = f"""
        Analyze this data summary for the question: "{user_question}"
        
        Dataset Overview:
        - Total records: {row_count}
        - Column insights:
        {chr(10).join(insights)}
        
        First few rows:
        {results_df.head(2).to_string()}
        
        Provide a 2-3 sentence summary that:
        1. Directly answers the user's question
        2. Highlights the most significant findings
        3. Mentions any notable patterns or trends
        """

        # Get explanation from LLM
        response = llm.invoke(analysis_prompt)
        explanation = response.content if hasattr(response, 'content') else str(response)
        
        # Format the final output
        formatted_explanation = f"""### 📊 Analysis Results

{explanation}

**Quick Stats:**
- Records analyzed: {row_count:,}
- Columns analyzed: {len(results_df.columns)}"""
        
        return formatted_explanation

    except Exception as e:
        return f"""
        ### ⚠️ Analysis Error
        
        Unable to analyze results: {str(e)}
        
        Basic Information:
        - Records: {len(results_df)}
        - Columns: {', '.join(results_df.columns)}
        """


def clean_column_names(headers):
    
    cleaned_headers = []
    seen_headers = {}
    
    for header in headers:
        # Convert to string and clean
        if pd.isna(header) or str(header).strip() == '':
            header = "Unnamed_Column"
        else:
            # Keep the original header text but clean it for SQL compatibility
            header = str(header).strip()
            # Replace special characters except spaces
            header = re.sub(r'[^\w\s]', '_', header)
            # Replace multiple spaces with single underscore
            header = re.sub(r'\s+', '_', header)
            
        # Handle duplicate headers
        base_header = header
        counter = 1
        while header in seen_headers:
            header = f"{base_header}_{counter}"
            counter += 1
        
        seen_headers[header] = True
        cleaned_headers.append(header)
    
    return cleaned_headers



def restructure_excel_sheet(uploaded_file):
    """Restructure and clean Excel sheet data, ensuring the first valid row becomes column headers.""" 
    try:
        # Read file bytes
        file_bytes = uploaded_file.read()
        excel_bytes = io.BytesIO(file_bytes)
        
        # Handle Excel files
        if uploaded_file.name.endswith(('.xlsx', '.xls')):
            excel_file = pd.ExcelFile(excel_bytes)
            sheets = excel_file.sheet_names
            
            cleaned_dfs = {}
            for sheet in sheets:
                # Read the sheet without header to inspect
                df = pd.read_excel(excel_bytes, sheet_name=sheet, header=None)
                
                # Skip empty sheets
                if df.empty or df.dropna(how='all').empty:
                    continue
                
                # Find the first row with valid data
                first_valid_row_index = df.apply(lambda x: x.notna().any(), axis=1).idxmax()
                headers = df.iloc[first_valid_row_index].fillna("Unnamed_Column").tolist()
                cleaned_headers = clean_column_names(headers)
                
                # Create new DataFrame with cleaned headers and remaining data
                cleaned_df = pd.DataFrame(df.iloc[first_valid_row_index + 1:].values, columns=cleaned_headers)
                
                # Remove completely empty rows and columns
                cleaned_df = cleaned_df.dropna(how='all')
                cleaned_df = cleaned_df.dropna(axis=1, how='all')
                
                if not cleaned_df.empty:
                    cleaned_dfs[sheet] = cleaned_df
            
            return cleaned_dfs if cleaned_dfs else None
            
        # Handle CSV files
        elif uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), header=None)
            
            if df.empty or df.dropna(how='all').empty:
                return None
                
            # Find the first row with valid data
            first_valid_row_index = df.apply(lambda x: x.notna().any(), axis=1).idxmax()
            headers = df.iloc[first_valid_row_index].fillna("Unnamed_Column").tolist()
            cleaned_headers = clean_column_names(headers)
            
            # Create new DataFrame with cleaned headers and remaining data
            cleaned_df = pd.DataFrame(df.iloc[first_valid_row_index + 1:].values, columns=cleaned_headers)
            
            # Remove completely empty rows and columns
            cleaned_df = cleaned_df.dropna(how='all')
            cleaned_df = cleaned_df.dropna(axis=1, how='all')
            
            return cleaned_df if not cleaned_df.empty else None
            
        return None
        
    except Exception as e:
        # Raise exception instead of using Streamlit error
        raise Exception(f"Error processing file: {str(e)}")
    finally:
        uploaded_file.seek(0)

def generate_and_execute_query(user_question, schema_str, llm, db_uri):
    """
    Generate and execute SQL query for PostgreSQL with improved error handling and debugging
    """
    try:
        # Generate initial query
        response = llm.invoke(f"""
        Based on this schema, generate a PostgreSQL-compatible query to answer the question.
        Double quote column names with spaces. Use CAST for type conversions if needed.
        
        Schema:
        {schema_str}
        
        Question: {user_question}
        
        Rules:
        1. Only use tables and columns that exist in the schema
        2. Use ILIKE with wildcards for case-insensitive text searches (e.g., WHERE column ILIKE '%value%')
        3. Double quote column names containing spaces
        4. Use appropriate JOINs if needed
        5. Return the bare SQL query without any markdown or comments
        """)
        
        sql_query = response.content if hasattr(response, 'content') else str(response)
        
        # Clean up the query
        sql_query = sql_query.strip()
        if sql_query.startswith('```sql'):
            sql_query = sql_query[6:-3]
        sql_query = sql_query.strip()
        
        # Execute query with better error handling
        engine = create_engine(db_uri)
        try:
            # Test query validity first
            with engine.connect() as connection:
        # Convert the query to SQLAlchemy text object
                test_query = text("EXPLAIN " + sql_query)
                connection.execute(test_query)
            
            # If valid, execute and get results
            results = pd.read_sql_query(text(sql_query), engine)
            
            if results.empty:
                # Try to debug the query
                debug_response = llm.invoke(f"""
                The following query returned no results. Please modify it to be more permissive:
                {sql_query}
                
                Schema:
                {schema_str}
                
                Original question: {user_question}
                
                Return only the modified query without any explanation.
                """)
                
                modified_query = debug_response.content.strip()
                if modified_query.startswith('```sql'):
                    modified_query = modified_query[6:-3].strip()
                
                # Try the modified query
                results = pd.read_sql_query(text(modified_query), engine)
                if not results.empty:
                    sql_query = modified_query  # Use the successful modified query
            
            return {
                'success': True,
                'query': sql_query,
                'results': results
            }
            
        except Exception as e:
            # If error occurs, try to fix the query
            fix_response = llm.invoke(f"""
            This query failed with error: {str(e)}
            Original query: {sql_query}
            
            Schema:
            {schema_str}
            
            Fix the query to work with PostgreSQL and the given schema.
            Return only the fixed query without any explanation.
            """)
            
            fixed_query = fix_response.content.strip()
            if fixed_query.startswith('```sql'):
                fixed_query = fixed_query[6:-3].strip()
            
            # Try the fixed query
            results = pd.read_sql_query(fixed_query, engine)
            return {
                'success': True,
                'query': fixed_query,
                'results': results
            }
            
        finally:
            engine.dispose()
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def clear_database_tables(engine):
    """Clear all tables from the data_analysis database"""
    try:
        with engine.connect() as conn:
            # Disable foreign key checks and transactions
            conn.execute(text("SET session_replication_role = 'replica';"))
            
            # Get list of all tables in public schema
            table_names_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE';
            """
            result = conn.execute(text(table_names_query))
            tables = [row[0] for row in result]
            
            # Drop each table
            if tables:
                for table in tables:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE;'))
                print("Database 'data_analysis' cleared successfully - all existing tables removed.")
            else:
                print("Database 'data_analysis' is already empty.")
                
            # Re-enable foreign key checks
            conn.execute(text("SET session_replication_role = 'origin';"))
            conn.commit()
            
    except Exception as e:
        print(f"Error clearing database: {str(e)}")
        raise e




class DataAnalysisAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def __init__(self):
        super().__init__()
        self.llm = None
        self.prompt_template = None
        try:
            # Use data_analysis database URL
            db_settings = settings.DATABASES['data_analysis']
            self.db_uri = f"postgresql://{db_settings['USER']}:{db_settings['PASSWORD']}@{db_settings['HOST']}:{db_settings['PORT']}/{db_settings['NAME']}"
        except AttributeError:
            raise Exception("Database configuration not found in Django settings")
        self.initialize_llm()

    def initialize_llm(self):
        try:
            self.prompt_template, self.llm = setup_llm()
            if self.llm is None:
                raise Exception("Failed to initialize LLM")
        except Exception as e:
            raise Exception(f"Error initializing LLM: {str(e)}")



    def post(self, request, *args, **kwargs):
        """Handle both file uploads and analysis queries"""
        print("Received request at DataAnalysisAPIView")
        print("Request method:", request.method)
        print("Request content type:", request.content_type)
        print("Request data:", request.data)
        content_type = request.content_type if hasattr(request, 'content_type') else ''
        
        if content_type and 'multipart/form-data' in content_type:
            return self.handle_file_upload(request)
        elif content_type and 'application/json' in content_type:
            return self.handle_analysis_query(request)
        else:
            return Response({
                'error': f'Unsupported content type: {content_type}'
            }, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)


    def handle_file_upload(self, request):
        try:
            uploaded_file = request.FILES['file']
            file_extension = os.path.splitext(uploaded_file.name)[1].lower()
            
            if file_extension not in ['.xlsx', '.xls', '.csv']:
                return Response({
                    'error': 'Invalid file type. Please upload .xlsx, .xls, or .csv files.'
                }, status=status.HTTP_400_BAD_REQUEST)

            processed_data = restructure_excel_sheet(uploaded_file)
            
            if processed_data is None:
                return Response({
                    'error': 'No valid data found in the uploaded file.'
                }, status=status.HTTP_400_BAD_REQUEST)

            engine = create_engine(self.db_uri)
            clear_database_tables(engine)

            if isinstance(processed_data, dict):
                tables_created = []
                for sheet_name, df in processed_data.items():
                    table_name = re.sub(r'[^\w]', '_', sheet_name.lower())
                    df.to_sql(table_name, engine, if_exists='replace', index=False)
                    tables_created.append(table_name)

                return Response({
                    'success': True,
                    'message': 'Multiple tables created successfully',
                    'tables': tables_created
                })
            else:
                table_name = 'main_data'
                processed_data.to_sql(table_name, engine, if_exists='replace', index=False)
                return Response({
                    'success': True,
                    'message': 'Table created successfully',
                    'table': table_name
                })

        except Exception as e:
            return Response({
                'error': f'Error processing file: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if 'engine' in locals():
                engine.dispose()

    def handle_analysis_query(self, request):
        try:
            user_question = request.data.get('query')
            if not user_question:
                return Response({
                    'error': 'Please provide a question.'
                }, status=status.HTTP_400_BAD_REQUEST)

            engine = create_engine(self.db_uri)
            schema_str = self.get_schema_info(engine)

            result = generate_and_execute_query(
                user_question,
                schema_str,
                self.llm,
                self.db_uri
            )

            if result['success']:
                if not result['results'].empty:
                    results_dict = result['results'].to_dict(orient='records')
                    explanation = generate_result_explanation(
                        result['results'],
                        user_question,
                        self.llm
                    )

                    return Response({
                        'success': True,
                        'query': result['query'],
                        'results': results_dict,
                        'explanation': explanation
                    })
                else:
                    return Response({
                        'success': True,
                        'message': 'No results found',
                        'query': result['query']
                    })
            else:
                return Response({
                    'error': result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({
                'error': f'Analysis error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if 'engine' in locals():
                engine.dispose()

    def get_schema_info(self, engine):
    
        try:
            with engine.connect() as conn:
                # Get all tables
                tables_query = """
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                        AND table_name != ''  
                        AND EXISTS (
                            SELECT 1 
                            FROM information_schema.columns 
                            WHERE table_name = tables.table_name
                        )
                """
                tables = pd.read_sql_query(tables_query, conn)
                
                schema_str = "Available tables and their columns:\n\n"
                for table_name in tables['table_name']:
                    # Get column information
                    columns_query = f"""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = '{table_name}'
                    """
                    columns = pd.read_sql_query(columns_query, conn)
                    
                    # Get sample data
                    sample_query = f"SELECT * FROM {table_name} LIMIT 3"
                    sample_rows = pd.read_sql_query(sample_query, conn)
                    
                    schema_str += f"Table: {table_name}\n"
                    schema_str += "Columns:\n"
                    for _, col in columns.iterrows():
                        col_name = col['column_name']
                        col_type = col['data_type']
                        sample_vals = sample_rows[col_name].tolist() if not sample_rows.empty else ['NULL']
                        schema_str += f"- {col_name} ({col_type}) - Samples: {', '.join(str(v) for v in sample_vals)}\n"
                    schema_str += "\n"
                
                return schema_str
                
        except Exception as e:
            raise Exception(f"Error getting schema info: {str(e)}")

    def get_db_uri(self):
        """Get database URI from Django settings""" 
        try:
            return settings.DATABASE_URL
        except AttributeError:
            raise Exception("DATABASE_URL not found in settings")
    
    def cleanup_temporary_files(self):
        """Clean up temporary files after processing"""
        try:
            # Add cleanup logic
            pass
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

    
    
class SaveResultsAPIView(APIView):
    def post(self, request):
        try:
            results_data = request.data.get('results', [])
            if not results_data:
                return Response({
                    'error': 'No results to save'
                }, status=status.HTTP_400_BAD_REQUEST)

            results_df = pd.DataFrame(results_data)
            os.makedirs('outputs', exist_ok=True)

            filename = f'query_results_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.csv'
            filepath = os.path.join('outputs', filename)
            results_df.to_csv(filepath, index=False)

            return Response({
                'success': True,
                'message': f'Results saved to {filepath}',
                'filepath': filepath
            })

        except Exception as e:
            return Response({
                'error': f'Error saving results: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)