import React from 'react';
import lightbulb from './lightbulb.svg';
import './App.css';
import XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import firebase from './Firebase.js'
import Grid from '@material-ui/core/Grid';
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import TextareaAutosize from "@material-ui/core/TextareaAutosize";
import FadeIn from "react-fade-in";
import {createMuiTheme, MuiThemeProvider} from "@material-ui/core";
import { green, red, yellow } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import voca from "voca"

const theme = createMuiTheme({
    palette: {
        primary: green,
        secondary: yellow,
        success: green,
        error: red,
        textPrimary: yellow
    },
    typography:{
        primary: yellow
    }
});

class App extends React.Component {

    state = {
      uid: null,
      inputEmails: null,
      emailArray: [],
      currentEmail: null,
      userData: {},
      userRuns: null,
      dataMatrix: [],
      emailErrorDict: [],
      storageRef: firebase.storage().ref()
  };

  constructor(props){
    super(props);
    this.submitEmail = this.submitEmail.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.retrieveUserData = this.retrieveUserData.bind(this);
    this.retrieveUserRuns = this.retrieveUserRuns.bind(this);
    this.addUserWorksheetToWorkbook = this.addUserWorksheetToWorkbook.bind(this);
    this.addEmailResult = this.addEmailResult.bind(this);
  }

  handleChange(event) {
      const target = event.target;
      const value = event.target.value;
      const name = target.name;

      this.setState({
        [name]: value
      });
  }

   async submitEmail(event){
       await this.parseEmails();
       this.setState({currentEmail: null});
       event.preventDefault();
       console.log("Input email is: "+ this.state.inputEmails);

        console.log(this.state.currentEmail);
        for(let email of this.state.emailArray) {

            await this.setState({currentEmail: email});

             await fetch('https://us-central1-vroomfirebase.cloudfunctions.net/getUidFromEmail', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.state.currentEmail
                })
            })
                .then(res => res.json())
                .then(async (uid) => {
                    if (uid.code === undefined) {
                        await this.retrieveUserData(uid);
                        await this.retrieveUserRuns(uid);
                    } else {
                        await this.addEmailResult(this.state.currentEmail, false, "This email does not currently exist in our database.");
                    }
                    return uid;
                }).then(async (uid) => {
                    console.log(JSON.stringify(uid.code));
                    if(uid.code === undefined) {
                        await this.createUserWorkbook();
                    }
                     }

                 ).catch(error => {
                console.log(error);
            })
        }
   };

    parseEmails() {
        this.setState({emailArray: []});
        const emailsString = this.state.inputEmails;
        console.log(emailsString);
        const emailsSpacesOnly = voca.replaceAll(emailsString, /(\r\n|\n|\r)/g, " ");
        //emailsString.replace(/\n/g, ' ');
        console.log("Email spaces only is : " + JSON.stringify(emailsSpacesOnly));
        const emailArray = [""];
        let emailIndex = 0;


        let characterArray = emailsSpacesOnly.split("");

        console.log(JSON.stringify(characterArray));
        characterArray.forEach(char => {
            if(char === " "){
                emailIndex++;
                emailArray[emailIndex] = "";
            }else{
                emailArray[emailIndex] = emailArray[emailIndex].concat(char);
            }
        });

        console.log("FINAL EMAIL LIST IS: " + JSON.stringify(emailArray));
        this.setState({emailArray: emailArray});
    };

    addEmailResult(email, wasSuccessful, resultInfo) {
        const copiedEmailErrors = [...this.state.emailErrorDict];
        copiedEmailErrors.push({
            email: email,
            wasSuccessful: wasSuccessful,
            resultInfo: resultInfo
        });
        this.setState({emailErrorDict: copiedEmailErrors})
    };
    //wasn't async
    async retrieveUserData(uid) {
      const userReference = firebase.database().ref("Users/" + uid);

      await userReference.once("value")
          .then((snapshot) => {
              //test this
              console.log(JSON.stringify(JSON.stringify(snapshot)));
              if(snapshot !== undefined){
                  this.setState({ userData: snapshot.val()});
                  delete this.state.userData.Case;
                  delete this.state.userData.Class;
              }else{
                  this.addEmailResult(this.state.currentEmail, false, "This email doesn't have any user data");
              }

       }).catch(error => { console.log(error) });
   };
//wasnt async
   async retrieveUserRuns(uid){
    const db = firebase.database().ref();
    const runsReference = db.child('Runs');
    const runsQuery = await runsReference
        .orderByChild('UserID')
        .equalTo(uid);

    await runsQuery.once('value', snapshot => {
        if(snapshot !== undefined) {
            this.setState({userRuns: snapshot.val()});
            this.state.userRuns != null ? console.log(this.state.userRuns) : console.log("still null");
            //this.createUserWorkbook();
        }else{
            this.addEmailResult(this.state.currentEmail, false,"This email doesn't have any valid user runs");
        }
    });
   };
//wasn't async
   async createUserWorkbook(){
       this.setState({dataMatrix: []});
       const workbook = XLSX.utils.book_new();
       let i = 0;
       await this.addUserWorksheetToWorkbook(workbook);
       for (let runName in this.state.userRuns){
           let userRun = this.state.userRuns[runName];
           console.log("We are about to convert a run for: " + JSON.stringify(userRun));
           //if(userRun !== undefined) {
               if (userRun.hasOwnProperty("ObjectReferences")) {
                   await this.createRunWorkSheet(userRun);
                   console.log("We have converted a run");
                   let worksheet = await XLSX.utils.aoa_to_sheet(this.state.dataMatrix);
                   await XLSX.utils.book_append_sheet(workbook, worksheet, "Run " + i);
                   i++;
               }
           //}
       }
       await XLSX.writeFile(workbook, "out.xlsx");
       await this.addEmailResult(this.state.currentEmail,true, "This email retrieval was successful!");
   };

   addUserWorksheetToWorkbook(workbook){
       let worksheet = XLSX.utils.aoa_to_sheet([
           ["Age", "First Name", "Gender", "Last Name", "Account Creation Date", "Race", "University"],
           Object.values(this.state.userData)]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Personal Profile")
   }

    async createRunWorkSheet(run){
       const matrixHeaders = ["Positive Rating", "Negative Rating", "Start Time", "Image", "Audio"];
       const headedDataMatrix=[];
       headedDataMatrix.push(matrixHeaders);
       this.setState({dataMatrix: headedDataMatrix});

      const assessmentObjects = run.ObjectReferences;
      for (let assessmentName in assessmentObjects) {
          const assessment = run.ObjectReferences[assessmentName];
          const fullAssessment = await this.addAssessmentMedia(assessment, assessmentName);
          await this.state.dataMatrix.push(Object.values(fullAssessment));
      }
   }

   async addAssessmentMedia(assessment, assessmentName){
       console.log("The assessment in addAssessmentMedia function is :" + JSON.stringify(assessment));
       console.log("Assessment Name is: " + assessment.key);
       const assessmentImage = await this.retrieveAssessmentMedia(assessmentName, "jpg");
       assessment.image = assessmentImage;
       const assessmentAudio = await this.retrieveAssessmentMedia(assessmentName, "wav");
       assessment.audio = assessmentAudio;
       return assessment;
   }

     async retrieveAssessmentMedia(assessmentName, mediaExtension) {
         return await this.state.storageRef
             .child(assessmentName + "." + mediaExtension)
             .getDownloadURL()
             .then(async function (url) {
             return url;
             })
             .catch(() => {
                 return "Media file not found!";
             });
     }

  render() {
    return (
        <MuiThemeProvider theme={theme}>
        <FadeIn>
        <React.Fragment>
            <AppBar position="static" style={{backgroundColor: "#418B31"}}>
                <Toolbar>
                    <img style={{height:60, width:60}}  src={lightbulb} alt="" />
                    <Typography variant="h4" style={{color: "white"}}>
                        Grasp IO
                    </Typography>
                </Toolbar>
            </AppBar>

            <Grid container spacing={3} justify="center">
                <Grid item xs={4}>
                    <h5 style={{color:"white", margin: ".25vh"}}>Paste Emails Here</h5>
                    <TextareaAutosize aria-label="minimum height" name="inputEmails" onChange={this.handleChange} style={{minHeight: "70vh", minWidth: "33vw", marginTop: ".25vh"}} placeholder="Leave a space or an indentation between each email" />
                    <Button variant="contained" color="secondary" fullWidth onClick={this.submitEmail}>Submit Emails</Button>
                </Grid>


                <Grid item xs={4}>
                    <h5 style={{color:"white", margin: ".25vh"}}>Email Errors</h5>
                    <div style={{overflowY: "auto", overflowX: "hidden", height: "70vh"}} >
                    <List height="100%" style={{maxHeight: "65vh", minHeight: "65vh", marginBottom: ".25vh"}}>
                        {this.state.emailErrorDict.map(emailResult => {
                                if(emailResult.wasSuccessful === true) {
                                    return (
                                    <FadeIn>
                                        <ListItem style={{backgroundColor: "#4bb543", margin: ".5vh"}}>
                                            <ListItemIcon>
                                                <CheckIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary={emailResult.email}
                                                          secondary={emailResult.resultInfo}/>
                                        </ListItem>
                                    </FadeIn>
                                    );
                                }else{
                                    return (
                                        <FadeIn>
                                            <ListItem style={{backgroundColor: "#fe6f6d", margin: ".5vh"}}>
                                                <ListItemIcon>
                                                    <CloseIcon />
                                                </ListItemIcon>
                                                <ListItemText primary={emailResult.email}
                                                              secondary={emailResult.resultInfo} />
                                            </ListItem>
                                        </FadeIn>
                                    );
                                }
                        })}
                    </List>
                    </div>
                </Grid>
            </Grid>
        </React.Fragment>
        </FadeIn>
        </MuiThemeProvider>
    );
  }
}

export default App;

