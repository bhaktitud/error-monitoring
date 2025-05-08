import { FC } from 'react';
import { FiGithub, FiTwitter, FiMail, FiHeart } from 'react-icons/fi';

export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white py-3 px-6 border-t text-xs">
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center space-x-4 text-gray-500">
          <div className="text-sm text-gray-600">
            © {currentYear} Error Monitor. All rights reserved.
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex space-x-4 text-gray-500">
            <a href="https://github.com" className="hover:text-gray-900 transition-colors">
              <FiGithub size={16} />
            </a>
            <a href="https://twitter.com" className="hover:text-gray-900 transition-colors">
              <FiTwitter size={16} />
            </a>
            <a href="mailto:info@errormonitor.com" className="hover:text-gray-900 transition-colors">
              <FiMail size={16} />
            </a>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Made with <FiHeart className="text-red-500 mx-1" size={14} /> in Indonesia
          </div>
        </div>
      </div>
    </footer>
  );
}; 