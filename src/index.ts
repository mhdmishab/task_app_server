import express from 'express';
import router from './routes/route';
import cors from "cors"

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use('/api', router);

app.use((err:any, req:any, res:any, next:any) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
