import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { TabsComponent } from './tabs/tabs.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import {TabViewModule} from 'primeng/tabview';
import {TableModule} from 'primeng/table';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    TabsComponent,
    DeliveryComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TabViewModule,
    TableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
