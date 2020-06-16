const validateEmail = function (email) {
  const pattern = new RegExp(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/);
  return pattern.test(email.toLowerCase());
};
export default validateEmail;
