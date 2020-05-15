import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { DeliveryOption } from '../types';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {

  requestPending: boolean = false;

  retailLocations: Array<any> = [];
  bars: Array<any> = [];
  // delivery: Array<DeliveryOption> = [];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.tabData$.subscribe((data: any) => {
      this.retailLocations = data.offPrem;
      this.bars  = data.onPrem;
    })
    this.apiService.loadingSubject.subscribe(isLoading => {
      this.requestPending = isLoading;
    })
  }

  setRetailMarkers() {
    if (this.requestPending === true) {
      return;
    }
    this.apiService.toggleMarkerTab(0);
  }

  setBarMarkers() {
    if (this.requestPending === true) {
      return;
    }
    this.apiService.toggleMarkerTab(1);
  }

}
