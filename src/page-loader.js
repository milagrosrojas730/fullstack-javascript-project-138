import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

const generateFileName = (url) => {
  const { hostname, pathname } = new URL(url);
  return `${hostname}${pathname.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
};

const pageLoader = async (url, outputDir = process.cwd()) => {
    try {
      const { data } = await axios.get(url);
      const fileName = generateFileName(url);
      const filePath = path.join(outputDir, fileName);
  
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(filePath, data);
      return filePath;
    } catch (error) {
      console.error(`Error downloading page: ${error.message}`);
      throw error;
    }
  };
  
export default pageLoader;
