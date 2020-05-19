import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApiService } from '../api.service';
import { DeliveryOption } from '../types';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TabsComponent implements OnInit {

  requestPending: boolean = false;

  cols = [
    { field: 'label', header: 'Label', width: '20%' },
    { field: 'title', header: 'Title', width: '40%' },
    { field: 'address', header: 'Address', width: '40%' }
  ];

  retailLocations: Array<any> = [];
  bars: Array<any> = [];
  // delivery: Array<DeliveryOption> = [];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.tabData$.subscribe((data: any) => {
      this.retailLocations = data.offPrem;
      this.bars = data.onPrem;
    })
    this.apiService.loadingSubject.subscribe(isLoading => {
      this.requestPending = isLoading;
    })
  }

  handleChange(event) {

    if (this.requestPending === true) {
      return;
    }

    if (event.index == 0) {
      this.apiService.toggleMarkerTab(0);
    } else if (event.index == 1) {
      this.apiService.toggleMarkerTab(1);
    }

  }

}
