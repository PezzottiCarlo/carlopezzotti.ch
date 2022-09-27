const express = require('express');
const cors = require('cors');
const app = express();
const Github = require('./github');

let github = new Github("PezzottiCarlo",process.env.GITHUB_TOKEN);
let languages = [];

let updateLanguages = async () => {
    let repos = await github.getReposList();
    for(let repo of repos.items){
        let langs = await github.getLanguages(repo.name);
        for(let lang of langs){
            if(!languages.includes(lang))
                languages.push(lang);
        }
    }
};setInterval(updateLanguages, 1000 * 60 * 60 * 24);

app.use(cors());
app.use("/", express.static("build"))

app.listen(8080, async () => {
    await updateLanguages();
    console.log("Server is running on port 8080");
});

app.get("/languages",async (req,res)=>{
    res.json(languages);
})
