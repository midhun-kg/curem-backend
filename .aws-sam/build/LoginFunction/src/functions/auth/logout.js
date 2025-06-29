exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Logged out. Token should be cleared on client." })
  };
};
