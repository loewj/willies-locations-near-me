import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
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
  selectedLocation = null;
  delivery: Array<any> = [];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.tabData$.subscribe((data: any) => {

      this.retailLocations = data.offPrem;
      this.bars = data.onPrem;

    })
    this.apiService.loadingSubject.subscribe(isLoading => {
      this.requestPending = isLoading;
    })
    this.apiService.locationSelected$.subscribe((selected: any) => {
      if (selected.onOffPrem == "ON") {
        this.selectedLocation = this.bars[selected.index]
      } else if (selected.onOffPrem == "OFF") {
        this.selectedLocation = this.retailLocations[selected.index]
      }
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

  rowClicked(rowData) {
    this.apiService.emitTableClicked(rowData);
  }

}
