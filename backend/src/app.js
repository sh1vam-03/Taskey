import express from "express";
import cors from "cors";
import routes from "./routes/index.js";


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use(routes);


export default app;