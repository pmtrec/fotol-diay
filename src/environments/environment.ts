export const environment = {
  production: false,
  apiUrl: 'http://localhost:3002/api',
  mockData: true,
  enableImageUpload: true,
  maxUploadSize: 5 * 1024 * 1024, // 5MB
  defaultPagination: {
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  },
  timeouts: {
    apiRequest: 30000,
    fileUpload: 60000
  },
  cloudinary: {
    cloudName: 'dx9vm7abv',
    uploadPreset: 'unsigned_preset'
  }
};