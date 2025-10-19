export const environment = {
  production: false,
  apiUrl: 'http://localhost:3002',
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
  },
  supabaseUrl: 'https://nwxxdahnhcxekyqwmsjo.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eHhkYWhuaGN4ZWt5cXdtc2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjU5NzIsImV4cCI6MjA3NjQwMTk3Mn0.HPcAmOWa1614NXs2u1E5FE3AgIwXJdhaDRufb8JFEZk'
};