import express from 'express'
import bodyParser from 'body-parser'
import {MongoClient} from 'mongodb'
import path from 'path'

const app = express();

app.use(express.static(path.join(__dirname,'/build')))
app.use(bodyParser.json())

const uri = "mongodb+srv://astray:astrayblue@react-app-hutmc.mongodb.net/test?retryWrites=true&w=majority";

const withDB = async (operations,res) => {
    try{    
        const client = await MongoClient.connect(uri, { useNewUrlParser: true});
        const db = client.db("blog");
        await operations(db)
        client.close()
    }catch(err){
        console.log(err)
        res.status(500).json({message: 'error connecting to db', err})
    }
}

app.post('/api/articles/:name/upvote', async (req,res) => {
    withDB(async (db)=>{
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articleName})
        await db.collection('articles').updateOne({ name: articleName}, {
            "$set": {
                upvotes: articleInfo.upvotes + 1,
            }
        })
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName})
        res.status(200).json(updatedArticleInfo)
    },res)
})

app.get('/api/articles/:name',async (req,res) => {
    const articleName = req.params.name;
    withDB(async (db)=>{
        const articlesInfo = await db.collection("articles").findOne( {name : articleName} )
        res.status(200).json(articlesInfo);
    },res)
   
})

app.post('/api/articles/:name/add-comment',(req,res)=>{
    const {username,text} = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                comments: articleInfo.comments.concat({username,text})
            }
        });
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
        
    },res)
})

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname+ '/build/index.html'));
})

app.listen(8000,()=>{
    console.log('Listening on port 8000')
})