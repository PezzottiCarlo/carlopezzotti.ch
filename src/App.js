import './App.css';
import React from 'react';
import { useEffect, useState } from 'react';
import { AiFillInstagram, AiFillGithub, AiFillLinkedin } from "react-icons/ai";


const App = () => {

  const welcomes = ["Benvenuto", "Bienvenue", "Willkommen", "Welcome"];
  const [projects, setProjects] = useState([]);
  const [welcome, setWelcome] = useState(welcomes[0]);

  useEffect(() => {
    const fetchProjects = async () => {
      let reqPrj = await fetch('https://api.github.com/users/PezzottiCarlo/repos');
      let data = await reqPrj.json();
      setProjects(data);
    }; fetchProjects();
    const interval = setInterval(() => {
      let index = Math.floor(Math.random() * welcomes.length);
      setWelcome(welcomes[index]);
    }, 1000)
  }, [])

  return (
    <div className="App">
      <div className='section'>
        <h1 className='big-text'>{welcome} 👋</h1>
      </div>
      <div className='section'>
        <h1>Mi chiamo <br/><span className='inverse'>Carlo Pezzotti</span></h1>
        <h1>vengo dalla <span className='inverse'>Svizzera🇨🇭</span></h1>
      </div>
      <div className='section'>
        <h1>Principalmente uso</h1>
        <div className='inverse big'>
          <h1>Javascript</h1>
          <h1>Node</h1>
          <h1>SQL</h1>
          <h1>Java</h1>
          <h1>C++</h1>
        </div>
      </div>
      <div className='section'>
        <h1>Alcuni miei lavori</h1>
        <div className='inverse big projects'>
          {projects.map((project, i) => (
            <div className='project'>
              <h1><a className='link' href={project.html_url}>{project.name}</a></h1>
              <h3>{project.description}</h3>
            </div>
          ))}
        </div>
      </div>
      <div className='section'>
        <h1>Contatti</h1>
        <div className='inverse big contact'>
          <div>
            <h1><a className='link' href='https://www.instagram.com/sgabello.blu/'><AiFillInstagram /></a></h1>
            <h2>Instagram</h2>
          </div>
          <div>
            <h1><a className='link' href='https://www.linkedin.com/in/carlo-pezzotti-893839235/'><AiFillLinkedin /></a></h1>
            <h2>Linkedin</h2>
          </div>
          <div>
            <h1><a className='link' href='https://github.com/PezzottiCarlo'><AiFillGithub /></a></h1>
            <h2>Github</h2>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
