 import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { CallLog } from '@ionic-native/call-log/ngx';
import { BatteryStatus } from '@ionic-native/battery-status/ngx';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { IonicStorageModule } from '@ionic/storage';
import { WebServer } from '@ionic-native/web-server/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { HttpClientModule } from '@angular/common/http';

import { Sensors } from '@ionic-native/sensors/ngx';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,HttpClientModule,IonicStorageModule.forRoot()],
  providers: [
    StatusBar,
    SplashScreen,
    BackgroundMode,
    TextToSpeech,
    CallLog,
    WebServer,
    BatteryStatus,
    Sensors,
    SMS,
    SpeechRecognition,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
