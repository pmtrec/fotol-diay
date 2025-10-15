export const environment = {
  production: true,
  apiUrl: '${API_URL}', // Will be replaced by build process
  mockData: false,
  enableImageUpload: true,
  maxUploadSize: 10 * 1024 * 1024, // 10MB in production
  defaultPagination: {
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
  },
  timeouts: {
    apiRequest: 45000, // Longer timeout in production
    fileUpload: 120000
  }
};