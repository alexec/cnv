import React from 'react';
import ReactDOM from 'react-dom';
import HelloWorld from './components/HelloWorld';
import './styles/app.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
ReactDOM.render(
   <HelloWorld />,
   document.getElementById('app')
);