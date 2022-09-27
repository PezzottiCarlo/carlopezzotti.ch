const fetch = require('node-fetch');

const API_BASE_LINK = 'https://api.github.com';
const GITHUB_BASE_LINK = 'https://github.com';
const GITHUB_BASE_LINK_TOKEN = (token) => `https://${token}@github.com`;


class Github {
    constructor(username, token) {
        this.username = username;
        this.token = token;
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

    async getForkList() {
        const response = await fetch(`${API_BASE_LINK}/users/${this.username}/repos`, {
            headers: {
                'Authorization': `token ${this.token}`,
                'User-Agent': 'node.js',
                'Content-Type': 'application/json'
            }
        });
        const all = await response.json();
        if(all.length > 0) 
            return all.filter(repo => repo.fork);
        return [];
    }

    async getLanguages(repo) {
        const response = await fetch(`${API_BASE_LINK}/repos/${this.username}/${repo}/languages`, {
            headers: {
                'Authorization': `token ${this.token}`,
                'User-Agent': 'node.js',
                'Content-Type': 'application/json'
            }
        });
        const languages = await response.json();
        return Object.keys(languages);
    }
}

module.exports = Github;

