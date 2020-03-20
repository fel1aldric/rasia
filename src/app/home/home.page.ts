import { Component } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { CallLog, CallLogObject } from '@ionic-native/call-log/ngx';
import { Platform } from '@ionic/angular';
import { BatteryStatus } from '@ionic-native/battery-status/ngx';
declare var SMSReceive: any;
declare var audioinput: any;
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { Storage } from '@ionic/storage';
import { MessageService } from '../api/message.service';
import { WebServer, Response } from '@ionic-native/web-server/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { LoadingController, AlertController } from '@ionic/angular';
import { Sensors, TYPE_SENSOR } from '@ionic-native/sensors/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
	filters: CallLogObject[];
	recordsFound: any;
	batterySubscription : any;
	baterystat = {level:0, isPlugged: false};
	url = "";
	device = {temperature: "", temperaturesalle: ""};
	constructor(private sensors: Sensors,private tts: TextToSpeech, private callLog: CallLog, private platform: Platform,private batteryStatus: BatteryStatus, private speechrecon: SpeechRecognition, private storage: Storage, public messageapi: MessageService,private webServer: WebServer,public alertController: AlertController,private sms: SMS) {
		this.platform.ready().then(() => {
			this.callLog.hasReadPermission().then(hasPermission => {
				if (!hasPermission) {
					var today = new Date();
				  var yesterday = new Date(today);
				  yesterday.setDate(today.getDate() - 1);
				  var fromTime = yesterday.getTime();
				  this.callLog.requestReadPermission().then(results => {
				    this.filters = [{
				        name: "type",
				        value: "3",
				        operator: "=="
				      }, {
				        name: "date",
				        value: fromTime.toString(),
				        operator: ">="
				    }];
				    this.callLog.getCallLog(this.filters).then(results => {
				          this.recordsFound = results;
				    }).catch(e => console.log(" LOG " + JSON.stringify(e)));
				  }).catch(e => console.log(" requestReadPermission " + JSON.stringify(e)));
				} else {
					var today = new Date();
				  var yesterday = new Date(today);
				  yesterday.setDate(today.getDate() - 1);
				  var fromTime = yesterday.getTime();
					this.filters = [{
				        name: "type",
				        value: "3",
				        operator: "==",
				      }, {
				        name: "date",
				        value: fromTime.toString(),
				        operator: ">=",
				    }];
				    this.callLog.getCallLog(this.filters).then(results => {
				        this.recordsFound = results;
				    }).catch(e => console.log(" LOG " + JSON.stringify(e)));
				}
			}).catch(e => console.log(" hasReadPermission " + JSON.stringify(e)));
			this.checkBattery();
			this.startsmslistener();
			this.startserver();
			this.sensordata();
	    });
		this.montre();
		this.urlserver();
	}
	sensordata(){
		
		setInterval(function () {
	    	this.sensors.enableSensor(TYPE_SENSOR.AMBIENT_TEMPERATURE);
	    	this.sensors.getState().then(results => {
		          this.device.temperaturesalle = results[0]
		    })
	    	this.sensors.disableSensor();
	    	this.sensorstemp();
  		}, 	300000);
	}
	sensorstemp(){
		this.sensors.enableSensor(TYPE_SENSOR.TEMPERATURE);
		this.sensors.getState().then(results => {
	          this.device.temperature = results[0]
	    })
    	this.sensors.disableSensor();
	}
	getUrlVars(url) {
	    var hash;
	    var myJson = {phone: "", text: ""};
	    var hashes = url.slice(url.indexOf('?') + 1).split('&');
	    for (var i = 0; i < hashes.length; i++) {
	        hash = hashes[i].split('=');
	        myJson[hash[0]] = hash[1];
	    }
	    return myJson;
	}
	urlserver(){
		this.storage.get('urlserveur').then(val => {
			if (val != "") {
				this.url = val;
			}
		});
	}
	startserver(){
		this.webServer.onRequest().subscribe(data => {
			// alert("requestId="+data.requestId+" body="+data.body+" methode="+data.method+" path="+data.path+" query="+data.query);
		  const res: Response = {
		    status: 200,
		    body: 'success',
		    headers: {
		      'Content-Type': 'text/html',
		      'Access-Control-Allow-Origin': '*',
		      'Access-Control-Allow-Credentials': 'true'
		    }
		  };
		  var params = this.getUrlVars(data.query);
		  this.sendsms(params.phone, params.text.replace(/%20/g, " "));
		  this.webServer.sendResponse(data.requestId, res);
		});
		this.webServer.start(8900).then().catch((error: any) => alert(error));;
	}
	sendsms(phone, text){
		this.sms.hasPermission().then((hasPermission) => {
		    if (hasPermission) {
		      this.sms.send(phone, text);
		    } else {
		          alert("permission non accorder");
		      }
		    }
		);
	}
	async configurl(){
		const alert = await this.alertController.create({
				header: 'Entrer l\'url du serveur',
				inputs: [
				{
				  name: 'url',
				  type: 'text',
				  placeholder: 'Url',
				  value: this.url
				},
				],
				buttons: [
				{
				  text: 'Cancel',
				  role: 'cancel',
				  cssClass: 'secondary',
				  handler: () => {
				    console.log('Confirm Cancel');
				  }
				}, {
				  text: 'Ok',
				  handler: (alertdata) => {
				    this.storage.set('urlserveur', alertdata.url);
				    this.urlserver()
				  }
				}
				]
		    });
		await alert.present();
	}
  calculateheur(){
  	var temp = new Date();
	var hour = temp.getHours();
	if (hour.toString().length == 1) {
      var houra = "0"+hour.toString();
    }
    else{
    	var houra = hour.toString();
    }
    return houra;
  }
  
  calculersecond(){
  	var temp = new Date();
  	var second = temp.getSeconds();
    if (second.toString().length == 1) {
      var seconda = "0"+second.toString();
    }
    else{
    	var seconda = second.toString();
    }
    return seconda;
  }
  calculateminute(){
  	var temp = new Date();
  	var hour = temp.getHours();
  	var minute = temp.getMinutes();
  	var second = temp.getSeconds();
  	if (hour.toString().length == 1) {
      var houra = "0"+hour.toString();
    }
    else{
    	var houra = hour.toString();
    }
    if (minute.toString().length == 1) {
      var minutea = "0"+minute.toString();
    }
    else{
    	var minutea = minute.toString();
    }
    if (minute == 0 && second == 0) {
    	this.tts.speak({
            text: "Il est "+hour.toString()+" heure ",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'));
        this.callLog.hasReadPermission().then(hasPermission => {
	        if (!hasPermission) {
	        	var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
	          this.callLog.requestReadPermission().then(results => {
	            this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "=="
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">="
			    }];
			    this.callLog.getCallLog(this.filters).then(results => {
			          this.recordsFound = results;
			    }).catch(e => console.log(" LOG " + JSON.stringify(e)));
	          }).catch(e => console.log(" requestReadPermission " + JSON.stringify(e)));
	        } else {
	        	var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
				this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "==",
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">=",
			    }];
			    this.callLog.getCallLog(this.filters).then(results => {
			        this.recordsFound = results;
			    }).catch(e => console.log(" LOG " + JSON.stringify(e)));
	        }
	      }).catch(e => console.log(" hasReadPermission " + JSON.stringify(e)));
    }
    else if (minute == 30 && second == 0) {
    	this.tts.speak({
            text: "Il est "+hour.toString()+" heure 30",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'));
        this.callLog.hasReadPermission().then(hasPermission => {
	        if (!hasPermission) {
	        	var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
	          this.callLog.requestReadPermission().then(results => {
	            this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "=="
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">="
			    }];
			    this.callLog.getCallLog(this.filters).then(results => {
			          this.recordsFound = results;
			    }).catch(e => console.log(" LOG " + JSON.stringify(e)));
	          }).catch(e => console.log(" requestReadPermission " + JSON.stringify(e)));
	        } else {
	        	var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
				this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "==",
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">=",
			    }];
			    this.callLog.getCallLog(this.filters).then(results => {
			        this.recordsFound = results;
			    }).catch(e => console.log(" LOG " + JSON.stringify(e)));
	        }
	      }).catch(e => console.log(" hasReadPermission " + JSON.stringify(e)));
    }
    else if(hour == 12 && minute == 0 && second == 0){
    	this.callLog.hasReadPermission().then(hasPermission => {
    		var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
	        if (!hasPermission) {
	          this.callLog.requestReadPermission().then(results => {
	            this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "==",
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">=",
			    }];
			    this.callLog.getCallLog(this.filters)
			        .then(results => {
			        	this.tts.speak({
				            text: "Vous aviez "+results.length.toString()+" appel en absence ce matin ",
				            locale: 'fr-FR',
				            rate: 0.75
				        })
				        .then(() => console.log('Success'));
			        })
			    .catch(e => console.log(" LOG " + JSON.stringify(e)));
	          })
	            .catch(e => console.log(" requestReadPermission " + JSON.stringify(e)));
	        } else {
				this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "==",
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">=",
			    }];
			    this.callLog.getCallLog(this.filters)
			        .then(results => {
			          this.tts.speak({
				            text: "Vous aviez "+results.length.toString()+" appel en absence ce matin ",
				            locale: 'fr-FR',
				            rate: 0.75
				        })
				        .then(() => console.log('Success'));
			        })
			    .catch(e => console.log(" LOG " + JSON.stringify(e)));
	        }
	    })
    }
    else if(hour == 19 && minute == 0 && second == 0){
    	this.callLog.hasReadPermission().then(hasPermission => {
    		var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
	        if (!hasPermission) {
	          this.callLog.requestReadPermission().then(results => {
	            this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "==",
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">=",
			    }];
			    this.callLog.getCallLog(this.filters)
			        .then(results => {
			        	this.tts.speak({
				            text: "Vous aviez "+results.length.toString()+" appel en absence aujourd'hui ",
				            locale: 'fr-FR',
				            rate: 0.75
				        })
				        .then(() => console.log('Success'));
			        })
			    .catch(e => console.log(" LOG " + JSON.stringify(e)));
	          })
	            .catch(e => console.log(" requestReadPermission " + JSON.stringify(e)));
	        } else {
				this.filters = [{
			        name: "type",
			        value: "3",
			        operator: "==",
			      }, {
			        name: "date",
			        value: fromTime.toString(),
			        operator: ">=",
			    }];
			    this.callLog.getCallLog(this.filters)
			        .then(results => {
			          this.tts.speak({
				            text: "Vous aviez "+results.length.toString()+" appel en absence aujourd'hui ",
				            locale: 'fr-FR',
				            rate: 0.75
				        })
				        .then(() => console.log('Success'));
			        })
			    .catch(e => console.log(" LOG " + JSON.stringify(e)));
	        }
	    })
    }
    return minutea;
  }
  batterystat(){
  	this.tts.speak({
        text: "Le batterie est maintenant à "+this.baterystat.level.toString()+" pour cent",
        locale: 'fr-FR',
        rate: 0.75
    })
    .then(() => console.log('Success'));
  }
  checkBattery(){
    this.batterySubscription = this.batteryStatus.onChange().subscribe(status => {
      if(status.level == 15 && !status.isPlugged) {
      	this.tts.speak({
            text: "Le batterie est maintenant à 15 pour cent. je vous suggère de le recharger",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'))
        
      }
      else if(status.isPlugged && !this.baterystat.isPlugged){
      	this.tts.speak({
            text: "Le batterie est maintenant en charge",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'))
        
      }
      else if(!status.isPlugged && this.baterystat.isPlugged){
      	this.tts.speak({
            text: "Chargeur déconnecté",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'))
        
      }
      else if(status.isPlugged && status.level == 100){
      	this.tts.speak({
            text: "Chargement du batterie est términer",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'))
        
      }
      else if (status.level == 50) {
      	this.tts.speak({
            text: "Le batterie est maintenant à 50 pour cent",
            locale: 'fr-FR',
            rate: 0.75
        })
        .then(() => console.log('Success'))
        
      }
      this.baterystat.level = status.level;
      this.baterystat.isPlugged = status.isPlugged;
    });
  }
  montre(){
  	setInterval(function () {
    	var temp = new Date();
	    var hour = temp.getHours();
	    var minute = temp.getMinutes();
	    if (hour.toString().length == 1) {
	      var houra = "0"+hour.toString();
	    }
	    else{
	    	var houra = hour.toString();
	    }
	    if (minute.toString().length == 1) {
	      var minutea = "0"+minute.toString();
	    }
	    else{
	    	var minutea = minute.toString();
	    }
  	}, 1000);
  }
  parle(){
  	var temp = new Date();
  	var hour = temp.getHours();
  	var minute = temp.getMinutes();
	this.tts.speak({
        text: "Il est "+hour.toString()+" heure "+minute.toString(),
        locale: 'fr-FR',
        rate: 0.75
    })
    .then(() => console.log('Success'))
    
  }
  parlelist(){
  	this.callLog.hasReadPermission().then(hasPermission => {
  		var today = new Date();
		      var yesterday = new Date(today);
		      yesterday.setDate(today.getDate() - 1);
		      var fromTime = yesterday.getTime();
        if (!hasPermission) {
          this.callLog.requestReadPermission().then(results => {
            this.filters = [{
		        name: "type",
		        value: "3",
		        operator: "==",
		      }, {
		        name: "date",
		        value: fromTime.toString(),
		        operator: ">=",
		    }];
		    this.callLog.getCallLog(this.filters)
		        .then(results => {
		        	this.tts.speak({
			            text: "Vous aviez "+results.length.toString()+" appel en absence aujourd'hui ",
			            locale: 'fr-FR',
			            rate: 0.75
			        })
			        .then(() => console.log('Success'))
			        
		        })
		    .catch(e => console.log(" LOG " + JSON.stringify(e)));
          })
            .catch(e => console.log(" requestReadPermission " + JSON.stringify(e)));
        } else {
			this.filters = [{
		        name: "type",
		        value: "3",
		        operator: "==",
		      }, {
		        name: "date",
		        value: fromTime.toString(),
		        operator: ">=",
		    }];
		    this.callLog.getCallLog(this.filters)
		        .then(results => {
		          this.tts.speak({
			            text: "Vous aviez "+results.length.toString()+" appel en absence aujourd'hui ",
			            locale: 'fr-FR',
			            rate: 0.75
			        })
			        .then(() => console.log('Success'))
			        
		        })
		    .catch(e => console.log(" LOG " + JSON.stringify(e)));
        }
	})
  }
  startsmslistener() {
    SMSReceive.startWatch(
    () => {
    	document.addEventListener('onSMSArrive', (e: any) => {
    		this.storage.get('urlserveur').then(val => {
				if (val != "") {
					this.messageapi.postMessage({phone: e.data.address.toString(), text: e.data.body.toString()}, val)
				    .subscribe(res => {
				    	
				      }, (err) => {
				        alert("impossible d'etablir la connexion")
				      });
				}
			});
        	this.tts.speak({
	         text: "Vous avez un nouveau message venant de "+e.data.address.toString(),
	           locale: 'fr-FR',
	            rate: 0.75
	         })
	         .then(() => console.log('Success'))
    	});
    })
  }
  startmicro(){
	let options = {
      language: 'fr-FR',
      showPopup: false
    }
	this.speechrecon.startListening(options)
	.subscribe(
		(matches: string[]) => {
			var key = ["quelle heure est-il", "il est quelle heure", "quelle heure il est", "quels heure est il", "heure actuel", 'heure actuelle', "heure actuelle", "heures actuelles"];
			var key2 = ["rapport de batterie status", "rapport des batterie", "bacterie statue", "status batterie", "bacteri stat", "batterie stat", "etat du batterie", "etat du bacteri", "batterie status"];
			var key3 = ["liste d'appel en absence", "listes d'appel en absence", "listes des appels en absence", "appels en absence", "appel en absence", "liste d'appels", "liste d'appel"];
			if (key.indexOf(matches[0]) != -1) {
				this.parle();
				return false;
			}
			else if (key2.indexOf(matches[0]) != -1) {
				this.batterystat();
				return false;
			}
			else if(key3.indexOf(matches[0]) != -1) {
				this.parlelist();
				return false;
			}
			else{
				alert(matches);
			}
			
		},
		(onerror) => alert(onerror)
	)
  }
  
}
