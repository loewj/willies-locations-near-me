import { Injectable } from '@angular/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { environment } from './../environments/environment';
import {  } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiCallObservable: Observable<any>;
  apiCallSubscriber: Subscription;
  loadingSubject = new BehaviorSubject(true);
  markerToggleSubject = new BehaviorSubject(null);

  markerLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  private _tabDataSource = new Subject();
  tabData$ = this._tabDataSource.asObservable();

  constructor(private http: HttpClient) {}

  fetchLocations(bounds) {

    this.loadingSubject.next(true);
    const apiPromise = this.http.post<any>(`${environment.apiUrl}/get-map-points`, {bounds}).toPromise()
    apiPromise.then(data => {

      // process the data
      const onPrem = data.locations.filter(
        (obj) => obj.onOffPremises === "ON"
      );
      const offPrem = data.locations.filter(
        (obj) => obj.onOffPremises === "OFF"
      );

      const onPremMarkers = [];
      for (let i = 0; i < onPrem.length && i < this.markerLabels.length; i++) {
        let data = onPrem[i].data[0];
        onPremMarkers.push({
          position: { lat: data.latitude, lng: data.longitude },
          title: onPrem[i].retailAccount,
          label: this.markerLabels.charAt(i),
          address: data.formattedAddress,
          addressLink: `https://www.google.com/maps/search/?api=1&${data.formattedAddress}`
        });
      }

      const offPremMarkers = [];
      for (let i = 0; i < offPrem.length && i < this.markerLabels.length; i++) {
        let data = offPrem[i].data[0];
        offPremMarkers.push({
          position: { lat: data.latitude, lng: data.longitude },
          title: offPrem[i].retailAccount,
          label: this.markerLabels.charAt(i),
          address: data.formattedAddress
        });
      }

      this._tabDataSource.next({
        onPrem: onPremMarkers,
        offPrem: offPremMarkers
      });

      this.loadingSubject.next(false);

    })

  }

  toggleMarkerTab(tab: number) {
      this.markerToggleSubject.next(tab);
  }

}
