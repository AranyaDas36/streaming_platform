const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://streaming-platform-iyl9.onrender.com'
    : 'http://localhost:4000'
};

export default config; 