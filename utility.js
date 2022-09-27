
const API_BASE_LINK = 'https://api.github.com';
const GITHUB_BASE_LINK = 'https://github.com';
const GITHUB_BASE_LINK_TOKEN = (token) => `https://${token}@github.com`;


class Github {
    constructor(username, token, reposPath) {
        this.username = username;
        this.token = token;
        this.reposPath = reposPath;
        if (!fs.existsSync(reposPath)) {
            shell.mkdir(reposPath);
        }
    }

    async getReposList() {
        const response = await fetch(`${API_BASE_LINK}/search/repositories?q=user:${this.username}`, {
            headers: {
                'Authorization': `token ${this.token}`,
                'User-Agent': 'node.js',
                'Content-Type': 'application/json'
            }
        });
        let repos = await response.json();
        let forked = await this.getForkList();
        if (forked.length > 0) {
            for (let fork of forked) {
                repos.items.push(fork);
            }
        }
        return repos;
    }
}
module.exports = Github;