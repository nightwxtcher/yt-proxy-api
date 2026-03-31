const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚙️  API Layer running at http://localhost:${PORT}/api/v1`);
});
