import React from 'react';
import { Router, Route, hashHistory } from 'react-router';
import ReactDOM from 'react-dom';
import App from './App';

const root = document.getElementById('app');

const app = (
  <Router history={ hashHistory }>
    <Route path='/' component={ App }>
	
    </Route>
  </Router>
)

ReactDOM.render(app, root);
