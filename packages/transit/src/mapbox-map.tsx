import {LngLat} from 'mapbox-gl';
import * as React from 'react';
import ReactMapboxGl, {ZoomControl} from 'react-mapbox-gl';

import {Feature, FeatureCollection} from '../../utils';
import {ChoroplethLayer} from './choropleth-layer';
import {CenterZoomLevel, LatLng} from './latlng';
import {RouteLayer} from './route-layer';

export interface Props {
  view: CenterZoomLevel;
  fillColors: {[geoId: string]: string};
  defaultFillColor: string;
  routes: FeatureCollection[];
  onLoad?: (map: mapboxgl.Map) => void;
  onError: (error: Error) => void;
  onClick?: (point: LatLng) => void;

  // Fired when the user moves the mouse over a feature in the choropleth.
  onChoroplethHover?: (feature: Feature, lngLat: LngLat, map: mapboxgl.Map) => any;

  // Fired when the mouse leaves the choropleth, e.g. because it's over water or a marker.
  onChoroplethLeave?: (map: mapboxgl.Map) => any;

  children?: any; // TODO(danvk): refine
}

// react-mapbox-gl uses reference equality on the Map's center and zoom props to determine whether
// it needs to change the viewport. We derive center and zoom and store them in state to get
// control over when this happens. Changes to props.view result in the viewport being updated.
// When the user pans/zooms, we also track that in State. This is the recommended approach, see
// https://github.com/alex3165/react-mapbox-gl#why-are-zoom-bearing-and-pitch-arrays-
interface State {
  center: [number, number];
  zoom: [number];
}

// TODO(danvk): load this via an environment variable.
const MapboxGL = ReactMapboxGl({
  accessToken:
    'pk.eyJ1Ijoic2lkZXdhbGstdXNlcnMiLCJhIjoiY2pnbnRyeXcwMGt6NDJxcjF4dDdzMDZpOSJ9.f17n6qwPPrk4z8yAP_-C0Q',
});

function viewToState(view: CenterZoomLevel): State {
  return {
    center: [view.center.lng, view.center.lat],
    zoom: [view.zoomLevel],
  };
}

export class Map extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = viewToState(props.view);
    this.onClick = this.onClick.bind(this);
    this.onZoomEnd = this.onZoomEnd.bind(this);
  }

  render() {
    const {center, zoom} = this.state;
    const {routes, fillColors, defaultFillColor} = this.props;

    const routesEls = routes.map((routeGeojson, i) => (
      <RouteLayer before="origin" geojson={routeGeojson} visibility={'visible'} key={`route${i}`} />
    ));

    return (
      <MapboxGL
        center={center}
        zoom={zoom}
        containerStyle={{flex: '1'}}
        style={'mapbox://styles/sidewalk-users/cjgpn0tle002m2rsbush2ckbj'}
        onStyleLoad={this.props.onLoad}
        onZoomEnd={this.onZoomEnd}
        onClick={this.onClick}>
        <ChoroplethLayer
          idProperty="geo_id"
          fillColors={fillColors}
          defaultFillColor={defaultFillColor}
          visibility="visible"
          before="poi-small"
        />
        {routesEls}
        {this.props.children}
        <ZoomControl position="bottom-right" />
      </MapboxGL>
    );
  }

  onClick(map: mapboxgl.Map, event: React.SyntheticEvent<any>) {
    if (this.props.onClick) {
      this.props.onClick((event as any).lngLat);
    }
  }

  componentWillReceiveProps(nextProps: Readonly<Props>) {
    const {view} = nextProps;
    if (view !== this.props.view) {
      // See comment for State interface.
      this.setState({
        center: [view.center.lng, view.center.lat],
      });
    }
  }

  onZoomEnd(map: mapboxgl.Map) {
    // See comment for State interface.
    const {lng, lat} = map.getCenter();
    const zoom = map.getZoom();
    this.setState({
      center: [lng, lat],
      zoom: [zoom],
    });
  }
}
