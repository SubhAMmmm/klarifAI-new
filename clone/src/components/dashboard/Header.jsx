// /* eslint-disable no-unused-vars */
// import React from 'react';
// import { LogOut } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import logo from '../../assets/Logo1.png';


// const  Header = () => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     navigate('/auth');
//   };

//   return (
//     <>
//     <header className="fixed top-0 left-0 right-0 border-b border-gray-700 bg-gray-800 z-50">
//       <div className="flex justify-between items-center px-4 py-2">
//         <div className="flex items-center space-x-4">
//           <img 
//             src={logo} 
//             alt="Logo" 
//             className="h-12 w-auto"
//           />
//           <h5 className="hidden lg:block text-white text-lg">
//             GPT-Powered Insights Activator
//           </h5>
//         </div>
        
//         <div className="flex items-center space-x-4 px-3">
//           <img 
//             src="/api/placeholder/40/40" 
//             alt="Profile" 
//             className="h-10 w-10 rounded-full border border-black"
//           />
//           <span className="text-white">{localStorage.getItem('username')}</span>
//           <LogOut 
//             className="h-5 w-5 text-white cursor-pointer" 
//             onClick={handleLogout}
//           />
//         </div>
//       </div>
//     </header>
//     </>
//   );
// };

// export default Header;

/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo1.png';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig'; // Adjust the import path as needed

const Header = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to retrieve and set user details on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // First, check local storage
        const storedUsername = localStorage.getItem('username');
        const storedProfileImage = localStorage.getItem('profile_image');

        // Set initial values from local storage
        if (storedUsername) {
          setUsername(storedUsername);
        }

        if (storedProfileImage) {
          setProfileImage(storedProfileImage);
        }

        // Fetch user profile from backend to ensure up-to-date information
        const response = await axiosInstance.get('/user/profile/');
        
        // Update username from backend response
        if (response.data.username) {
          setUsername(response.data.username);
          localStorage.setItem('username', response.data.username);
        }

        // Use default avatar generation if no profile picture
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(response.data.username)}&background=random`;
        
        // Update profile image
        setProfileImage(response.data.profile_picture || defaultAvatar);
        localStorage.setItem('profile_image', response.data.profile_picture || defaultAvatar);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        
        // Fallback to stored username or default
        const fallbackUsername = localStorage.getItem('username') || 'User';
        setUsername(fallbackUsername);

        // Generate default avatar based on fallback username
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackUsername)}&background=random`;
        setProfileImage(fallbackAvatar);
        localStorage.setItem('profile_image', fallbackAvatar);

        // Show error toast if backend fetch fails
        toast.error('Could not retrieve full user profile');
      } finally {
        setIsLoading(false);
      }
    };

    // Check if token exists before fetching
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      // Redirect to login if no token
      navigate('/auth');
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      // Clear all authentication-related local storage items
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('profile_image');

      // Show logout success toast
      toast.success('Logged out successfully');

      // Redirect to authentication page
      navigate('/auth');
    } catch (error) {
      // Handle any potential logout errors
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-gray-800 z-50">
        <div className="flex justify-between items-center px-4 py-2">
          <div>Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header 
      className="
        fixed top-0 left-0 right-0 
        bg-gradient-to-tl from-gray-700/20
        
        z-50 shadow-md
      "
    >
      <div className="flex justify-between items-center px-4 py-2">
        {/* Logo and Title Section */}
        <div className="flex items-center space-x-4">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-12 w-auto transition-transform hover:scale-105"
          />
          {/* <h5 className="hidden lg:block text-white text-lg font-semibold tracking-wider">
            GPT-Powered Insights Activator
          </h5> */}
        </div>
        
        {/* User Profile and Logout Section */}
        <div className="flex items-center space-x-4 px-3">
          {/* Profile Image with Fallback */}
          <div className="relative">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="
                  h-10 w-10 rounded-full 
                  border-2 border-blue-500 
                  object-cover
                "
              />
            ) : (
              <div 
                className="
                  h-10 w-10 rounded-full 
                  bg-gray-600 flex items-center 
                  justify-center text-white
                "
              >
                <User size={20} />
              </div>
            )}
            {/* Optional: Online status indicator */}
            <span 
              className="
                absolute bottom-0 right-0 
                h-3 w-3 bg-green-500 
                rounded-full 
                border-2 border-gray-800
              "
            />
          </div>

          {/* Username Display */}
          <span 
            className="
              text-white font-medium 
              max-w-[100px] truncate 
              hover:text-blue-300 
              transition-colors
            "
            title={username}
          >
            {username}
          </span>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="
              text-white hover:text-red-400 
              transition-colors group
            "
            title="Logout"
          >
            <LogOut 
              className="
                h-5 w-5 
                group-hover:rotate-12 
                transition-transform
              " 
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;