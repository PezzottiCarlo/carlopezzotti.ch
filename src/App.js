import './App.css';
import React from 'react';
import { useEffect, useState, useRef} from 'react';
import { AiFillInstagram, AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import { FaAngleDoubleDown } from 'react-icons/fa';


const App = () => {

  const [projects, setProjects] = useState([]);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      let reqPrj = await fetch('https://api.github.com/users/PezzottiCarlo/repos');
      let data = await reqPrj.json();
      setProjects(data);
    }; fetchProjects();
    const fetchLanguages = async () => {
      let reqPrj = await fetch('languages');
      let data = await reqPrj.json();
      setLanguages(data);
    }; fetchLanguages();
  }, [])


  return (
    <div className="App">
      <div className='section'>
        <h1 className='big-text'>Salve 👋</h1>
        <div className='scroll-down'>
          <FaAngleDoubleDown />
        </div>
      </div>
      <div className='section'>
        <h1>Mi chiamo <br/><span className='inverse'>Carlo Pezzotti</span></h1>
        <h1>vengo dalla <span className='inverse'>Svizzera🇨🇭</span></h1>
      </div>
      <div className='section'>
        <h1>Principalmente uso</h1>
        <div className='inverse big'>
          {languages.map((language, index) => {
            return <h1 key={index}>{language}</h1>
          })}
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
