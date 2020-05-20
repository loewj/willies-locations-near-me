import { Injectable } from '@angular/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { environment } from './../environments/environment';
import { } from 'rxjs/operators';

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

  private _locationSelectedSource = new Subject();
  locationSelected$ = this._locationSelectedSource.asObservable();

  private _tableClickedSource = new Subject();
  tableClicked$ = this._tableClickedSource.asObservable();

  constructor(private http: HttpClient) { }

  fetchLocations(bounds, center) {

    const payload = { bounds: bounds, center: center }

    this.loadingSubject.next(true);
    const apiPromise = this.http.post<any>(`${environment.apiUrl}/get-map-points`, payload).toPromise()
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

        let addressLink = encodeURI(`https://www.google.com/maps/search/?api=1&query=${data.formattedAddress}`);

        let contentString = '<div id="content">' +
          '<div id="siteNotice">' +
          '</div>' +
          `<h6 id="firstHeading" class="firstHeading">${this.markerLabels.charAt(i)}) ${onPrem[i].retailAccount}</h6>` +
          '<div id="bodyContent">' +
          `<a href=${addressLink} target='_blank'>${data.formattedAddress}</p></a>` +
          '</div>' +
          '</div>';

        onPremMarkers.push({
          index: i,
          onOffPrem: "ON",
          position: { lat: data.latitude, lng: data.longitude },
          title: onPrem[i].retailAccount,
          label: this.markerLabels.charAt(i),
          address: data.formattedAddress,
          addressLink: addressLink,
          contentString: contentString
        });
      }

      const offPremMarkers = [];
      for (let i = 0; i < offPrem.length && i < this.markerLabels.length; i++) {

        let data = offPrem[i].data[0];

        let addressLink = encodeURI(`https://www.google.com/maps/search/?api=1&query=${data.formattedAddress}`);

        let contentString = '<div id="content">' +
          '<div id="siteNotice">' +
          '</div>' +
          `<h6 id="firstHeading" class="firstHeading">${this.markerLabels.charAt(i)}) ${offPrem[i].retailAccount}</h6>` +
          '<div id="bodyContent">' +
          `<a href=${addressLink} target='_blank'>${data.formattedAddress}</p></a>` +
          '</div>' +
          '</div>';

        offPremMarkers.push({
          index: i,
          onOffPrem: "OFF",
          position: { lat: data.latitude, lng: data.longitude },
          title: offPrem[i].retailAccount,
          label: this.markerLabels.charAt(i),
          address: data.formattedAddress,
          addressLink: addressLink,
          contentString: contentString
        });

      }

      let formattedDeliveryOptions = [];
      Object.entries(data.delivery).forEach(entry => {
        let key = entry[0];
        let value: any = entry[1];

        value.sort(function (a, b) {
          var textA = a.city.toUpperCase();
          var textB = b.city.toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        let cityMap = new Map();
        for (let i = 0; i < value.length; i++) {
          if (!cityMap.has(value[i].city)) {
            cityMap.set(value[i].city, []);
          }
          let arr = cityMap.get(value[i].city);
          arr.push(value[i].zip);
          cityMap.set(value[i].city, arr);
        }

        const deliveredTo = []
        cityMap.forEach((value, key) => {
          deliveredTo.push(`${key}: ${value.join(", ")}`)
        });

        formattedDeliveryOptions.push({
          title: `${key} (${value.length} zip codes)`,
          data: deliveredTo
        })
      });

      this._tabDataSource.next({
        onPrem: onPremMarkers,
        offPrem: offPremMarkers,
        delivery: formattedDeliveryOptions
      });

      this.loadingSubject.next(false);

    })

  }

  toggleMarkerTab(tab: number) {
    this.markerToggleSubject.next(tab);
  }

  emitMarkerClicked(data) {
    this._locationSelectedSource.next(data);
  }

  emitTableClicked(index) {
    this._tableClickedSource.next(index);
  }

}
