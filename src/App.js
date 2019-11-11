import React from 'react';
import lightbulb from './lightbulb.svg';
import './App.css';
import XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Image, Navbar, Nav, NavItem, NavDropdown, MenuItem, NavbarBrand, Container} from 'react-bootstrap';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import firebase from './Firebase.js'
class App extends React.Component {
  Constructor(props){
    this.setState({})
  }
  render() {
    return (
        <React.Fragment>
          <Navbar>
            <NavbarBrand>
              <a href='https://www.healthline.com/nutrition/healthiest-beans-legumes' style={{color: '#418B31'}}>
                <img style={{height:60, width:60}}  src={lightbulb} alt="" />
                {'Grasp IO'}
              </a>
            </NavbarBrand>
          </Navbar>
          <Row>
            <Col />
            <Col>
              <form>
                <label style={{margin:'0vw 1vw' }}>Paste your emails in here</label>
                <textarea style={{height:'75vh',width:'31vw',margin:'0vw 1vw' }}>japperales@bsu.edu</textarea>
                <button id={'submitButton'} style={{margin:'0vw 1vw'}}>Create Data Sheets</button>
              </form>
            </Col>
            <Col>
              <form>
                <label style={{margin:'0vw 1vw'}}>Emails we didn't find</label>
                <textarea style={{height:'75vh',width:'31vw',margin:'0vw 1vw' }}>yu@yu.yu</textarea>
                <button id={'copyButton'} style={{margin:'0vw 1vw'}}>Copy found emails</button>
              </form>
            </Col>
            <Col />
          </Row>
        </React.Fragment>
    );
  }
}

export default App;

