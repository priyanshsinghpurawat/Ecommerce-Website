import '@testing-library/jest-dom';

if (typeof window !== 'undefined') {
  window.URL.createObjectURL = window.URL.createObjectURL || (() => 'blob:mock-url');
  window.URL.revokeObjectURL = window.URL.revokeObjectURL || (() => {});
}
if (typeof global !== 'undefined') {
  global.URL.createObjectURL = global.URL.createObjectURL || (() => 'blob:mock-url');
  global.URL.revokeObjectURL = global.URL.revokeObjectURL || (() => {});
}
