const express = require("express");
var cors = require('cors')
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())
global.XMLHttpRequest = require("xhr2");


// Routes
const booksRoutes = require("./routes/books.routes");
app.use("/books", booksRoutes);

app.listen(port);

console.log("RESTful API server started on: " + port);
