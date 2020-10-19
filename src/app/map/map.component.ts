import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { } from 'googlemaps';
import { ApiService } from '../api.service';
import { fromEventPattern, Subscription, Observable, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @ViewChild('map', { static: true }) mapElement: any;
  @ViewChild('inputEl', { static: true }) inputElement: ElementRef;

  map: google.maps.Map;
  requestPending: boolean = false;

  mapObservable: Observable<any>;
  mapSubscription: Subscription;

  youAreHereMarker;

  retailMarkers: Array<any> = [];
  barMarkers: Array<any> = [];

  selectedTab = 0;

  defaultCoord = { lat: 42.363744, lng: -71.059887 }

  searchBox;
  cancelNextReposition = false;

  retailInfoWindows = [];
  barInfoWindows = [];

  activeInfoWindow;

  constructor(
    private router: Router,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {

    const mapProperties = {
      center: this.getLatLngFromUrl(),
      zoom: 11,
      maxZoom: 15,
      minZoom: 10,
      mapTypeControl: false,
      mapTypeId: 'hybrid'
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
      if (this.cancelNextReposition == true) {
        this.cancelNextReposition = false;
      } else {
        // write the lat/lng to the URL so Adam can watch for it
        this.router.navigate([], {
          queryParams: {
            lat: this.map.getCenter().lat(),
            lng: this.map.getCenter().lng()
          },
          queryParamsHandling: 'merge',
        });
        this.apiService.fetchLocations(this.map.getBounds(), this.map.getCenter());
        // place a 'you are here' marker
        if (this.youAreHereMarker) {
          this.setMapOnAll([this.youAreHereMarker], true)
        }

        this.youAreHereMarker = new google.maps.Marker({
          position: {
            lat: this.map.getCenter().lat(),
            lng: this.map.getCenter().lng()
          },
          title: 'You are here',
          icon: 'http://maps.google.com/mapfiles/kml/paddle/blu-diamond.png'
        })
        this.youAreHereMarker.setMap(this.map);
      }
    });

    this.apiService.tabData$.subscribe((data: any) => {

      this.setMapOnAll(this.barMarkers, true);
      this.setMapOnAll(this.retailMarkers, true);

      const offPremData = this.getMarkers(data.offPrem);
      this.retailMarkers = offPremData.map(el => el.marker);
      this.retailInfoWindows = offPremData.map(el => el.infowindow);

      const onPremData = this.getMarkers(data.onPrem);
      this.barMarkers = onPremData.map(el => el.marker);
      this.barInfoWindows = onPremData.map(el => el.infowindow);

    })

    this.apiService.loadingSubject.subscribe(isLoading => {
      this.requestPending = isLoading;
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

    this.searchBox = new google.maps.places.SearchBox(this.inputElement.nativeElement);
    this.setupSearchBoxListener()

    this.apiService.tableClicked$.subscribe((data: any) => {

      if (this.activeInfoWindow) {
        this.activeInfoWindow.close();
      }

      // pass in the on/off prem markers
      if (data.onOffPrem == "ON") {
        this.activeInfoWindow = this.barInfoWindows[data.index];
        this.barInfoWindows[data.index].open(this.map, this.barMarkers[data.index]);
      } else if (data.onOffPrem == "OFF") {
        this.activeInfoWindow = this.retailInfoWindows[data.index];
        this.retailInfoWindows[data.index].open(this.map, this.retailMarkers[data.index]);
      }

      this.cancelNextReposition = true;

    });

  }

  setupSearchBoxListener() {

    this.searchBox.addListener("places_changed", () => {

      let places = this.searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      // For each place, get the icon, name and location.
      let bounds = new google.maps.LatLngBounds();
      places.forEach(function (place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      this.map.fitBounds(bounds);
    });

    return this.map;

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

    const markersAndWindows = data.map(el => {

      const infowindow = new google.maps.InfoWindow({
        content: el.contentString
      });


      const marker = new google.maps.Marker({
        position: el.position,
        title: el.title,
        label: el.label
      })

      marker.addListener('click', (event) => {

        if (this.activeInfoWindow) { this.activeInfoWindow.close(); }
        infowindow.open(this.map, marker);
        this.apiService.emitMarkerClicked({ onOffPrem: el.onOffPrem, index: el.index });
        this.cancelNextReposition = true;
        this.activeInfoWindow = infowindow;
      });

      return { marker: marker, infowindow: infowindow };

    });

    return markersAndWindows;

  }

  setMapOnAll(mapMarkers, remove) {

    const bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < mapMarkers.length; i++) {
      
      if (remove) {
        mapMarkers[i].setMap(null);
      } else {

        if (mapMarkers[i].getVisible()) {
          bounds.extend(mapMarkers[i].getPosition());
        }

        mapMarkers[i].setMap(this.map);
      }
    }

    if (!remove && mapMarkers.length > 0) {
      this.map.fitBounds(bounds);
      this.cancelNextReposition = true;
    }

  }

}
