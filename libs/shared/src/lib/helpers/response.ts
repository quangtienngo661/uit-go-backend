export const success = (data: any, statusCode = 200, message = 'Success') => {
  return {
    statusCode, 
    message,
    data
  };
}