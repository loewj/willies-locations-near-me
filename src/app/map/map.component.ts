import { Component, OnInit, ViewChild } from '@angular/core';
import { } from 'googlemaps';
import { ApiService } from '../api.service';
import { fromEventPattern, Subscription, Observable, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @ViewChild('map', { static: true }) mapElement: any;

  map: google.maps.Map;

  mapObservable: Observable<any>;
  mapSubscription: Subscription;

  retailMarkers: Array<any> = [];
  barMarkers: Array<any> = [];

  selectedTab = 0;

  defaultCoord = { lat: 42.363744, lng: -71.059887 }

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {

    const mapProperties = {
      center: this.getLatLngFromUrl(),
      zoom: 12,
      maxZoom: 15,
      minZoom: 10,
      // restriction: {
      //   latLngBounds: NEW_ENGLAND_BOUNDS,
      //   strictBounds: false,
      // },
      mapTypeControl: false,
      styles: [
        {
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#f5f5f5"
            }
          ]
        },
        {
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#616161"
            }
          ]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#f5f5f5"
            }
          ]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#bdbdbd"
            }
          ]
        },
        {
          "featureType": "poi",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#eeeeee"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#757575"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#e5e5e5"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#ffffff"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#6dbe4b"
            }
          ]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#757575"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#385dab"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#616161"
            }
          ]
        },
        {
          "featureType": "road.local",
          "elementType": "geometry.fill",
          "stylers": [
            {
              "color": "#f8de08"
            }
          ]
        },
        {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        },
        {
          "featureType": "transit",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#e5e5e5"
            }
          ]
        },
        {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#eeeeee"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#c9c9c9"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        }
      ]
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, <any>mapProperties);

    this.mapObservable = fromEventPattern(
      (handler) => {
        return this.map.addListener('idle', handler);
      },
      (handler, listener) => {
        google.maps.event.removeListener(listener);
      }
    ).pipe(debounce(() => interval(1500)));

    this.mapSubscription = this.mapObservable.subscribe(() => {
      this.apiService.fetchLocations(this.map.getBounds());
    });

    this.apiService.tabData$.subscribe((data: any) => {
      this.setMapOnAll(this.barMarkers, true);
      this.setMapOnAll(this.retailMarkers, true);
      this.retailMarkers = this.getMarkers(data.offPrem);
      this.barMarkers = this.getMarkers(data.onPrem);

    })

    this.apiService.loadingSubject.subscribe(isLoading => {
      if (isLoading == false) {
        this.setSelectedLayer();
      }
    })

    this.apiService.markerToggleSubject.subscribe((tab) => {
      if (tab == null) {
        return;
      }
      this.selectedTab = tab;
      this.setSelectedLayer();
    })

  }

  setSelectedLayer() {
    if (this.selectedTab == 0) {
      this.setMapOnAll(this.barMarkers, true);
      this.setMapOnAll(this.retailMarkers, false);
    } else if (this.selectedTab == 1) {
      this.setMapOnAll(this.barMarkers, false);
      this.setMapOnAll(this.retailMarkers, true);
    }
  }

  getLatLngFromUrl() {

    var url = new URL(window.location.href);
    var searchParams = new URLSearchParams(url.search);

    if (searchParams.has("lat") && searchParams.has("lng")) {
      return {
        lat: parseFloat(searchParams.get("lat")),
        lng: parseFloat(searchParams.get("lng")),
      };
    }

    return this.defaultCoord;

  }

  getMarkers(data) {

    return data.map(el => {
      return new google.maps.Marker({
        position: el.position,
        title: el.title,
        label: el.label
      })
    });

  }

  setMapOnAll(mapMarkers, remove) {
    for (var i = 0; i < mapMarkers.length; i++) {
      if (remove) {
        mapMarkers[i].setMap(null);
      } else {
        mapMarkers[i].setMap(this.map);
      }
    }
  }

}
