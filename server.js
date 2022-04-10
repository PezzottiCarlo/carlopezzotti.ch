const express = require('express');
const cors = require('cors');
const app = express();


app.use(cors());
app.use("/", express.static("../build"))

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});