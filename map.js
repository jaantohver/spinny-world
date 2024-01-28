Vue.component('world-map', {
    template: '#template-world-map',
    mixins: [componentMixin],
    props: {
      'attrs': {
        default: ''
      },
      'index': {
        default: ''
      },
      'ease': {
        default: 'ease-in'
      }
    },
    data() {
      return {
        prefix: 'world-map',
        hover: false,
        gsap: [],
        countries: [],
        animationCountries: [],
        listOfCountries: [124, 840, 360, 152, 404, 214, 578, 710, 484, 858, 76, 170, 591, 188, 250, 376, 788, 784, 764, 410, 356, 586, 752, 804, 616, 40, 348, 642, 440, 428, 233, 276, 100, 792, 8, 191, 756, 442, 56, 528, 620, 724, 372, 554, 36, 156, 380, 208, 826, 268, 608, 458, 705, 246, 703, 203, 392, 818, 688],
        currentStep: -1,
        inview: false,
              inited: false
      };
    },
    mounted: function() {
      var that = this;
      that.init();

      // setTimeout(function(){
        // 	that.init();
      // 	},9000)
    },
    methods: {
      animateMouseOut() {

      },
      getRandomStep() {
        var newStep = this.animationCountries[Math.floor(Math.random() * this.animationCountries.length)];
        var lastStep = this.currentStep;
        while (lastStep == newStep) {
          newStep = this.animationCountries[Math.floor(Math.random() * this.animationCountries.length)];
        }

        return newStep;
      },
      step(event) {
          if(!this.inited) {
              this.init();
              //return false;
              } else {
                  if(event) {
                      this.inview = event.detail.state == 'enter' ? true : false;
                  }

                  // if (!this.inview) {
                  // 	return false;
                  // }
                  var country = this.country;

                  var rotate = this.d3_geo_greatArcInterpolator();
                  var that = this;

                  this.currentStep = this.getRandomStep();
                  if(typeof this.country == 'undefined') {
                      return false;
                  }

                  country.transition()
                          .style('fill', function(d, j) {
                              return j === that.currentStep ? '#bbfcfa' : (that.animationCountries.includes(j) ? '#ffd366' : '#3e7ce6');
                          })
                          .style('fill-opacity', function(d, j) {
                              return j === that.currentStep ? 1 : (that.animationCountries.includes(j) ? '1' : '.4');
                          });
                  d3.transition()
                          .delay(10)
                          .duration(1250)
                          .tween('rotate', function() {
                              var point = that.centroid(that.countries[that.currentStep]);
                              rotate.source(that.projection.rotate()).target([-point[0], -point[1]]).distance();
                              return function(t) {
                                  that.projection.rotate(rotate(t)).clipAngle(180);
                                  that.backCountry.attr('d', that.path);
                                  that.backLine.attr('d', that.path);

                                  that.projection.rotate(rotate(t)).clipAngle(90);
                                  country.attr('d', that.path);
                                  that.line.attr('d', that.path);
                              };
                          })
                          .transition()
                          .each('end', that.step);
              }


      },
      init() {
        var that = this;
  if(that.inited){return false};
              that.inited = true;

        var width = window.outerWidth < 600 ? 320 : 640,
            height = window.outerWidth < 600 ? 320 : 640;

        this.centroid = d3.geo.path()
            .projection(function(d) {
              return d;
            })
            .centroid;

        this.projection = d3.geo.orthographic()
            .scale(height / 2.0)
            .translate([width / 2, height / 2])
            .clipAngle(90);

        this.path = d3.geo.path()
            .projection(that.projection);

        this.graticule = d3.geo.graticule()
            .extent([[-180, -90], [180 - .1, 90 - .1]]);

        var svg = d3.select(this.$el).append('svg')
            .attr('width', width)
            .attr('height', height).attr("viewBox", "0 0 " + width + " " + height ).attr("preserveAspectRatio", "xMinYMin");

        svg.append('circle')
            .attr('class', 'world-outline')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', that.projection.scale());

        d3.json('/wp-content/themes/ganttic2022/assets/world-110m.json', function(error, world) {
          that.countries = topojson.object(world, world.objects.countries).geometries;

          that.countries.map(function(x, k) {
                if (that.listOfCountries.includes(x.id)) {
                  that.animationCountries.push(k);
                }
              }
          );

          that.projection.clipAngle(180);

          that.backLine = svg.append('path')
              .datum(that.graticule)
              .attr('class', 'back-line')
              .attr('d', that.path);

          that.backCountry = svg.selectAll('.back-country')
              .data(that.countries)
              .enter().insert('path', '.back-line')
              .attr('class', 'back-country')
              .attr('d', that.path);

          that.projection.clipAngle(90);

          that.line = svg.append('path')
              .datum(that.graticule)
              .attr('class', 'line')
              .attr('d', that.path);

          that.country = svg.selectAll('.country')
              .data(that.countries)
              .enter().insert('path', '.line')
              .attr('class', 'country')
              .attr('d', that.path);


          that.step();
        });
      },

      d3_geo_greatArcInterpolator() {
        var d3_radians = Math.PI / 180;
        var x0, y0, cy0, sy0, kx0, ky0,
            x1, y1, cy1, sy1, kx1, ky1,
            d,
            k;

        function interpolate(t) {
          var B = Math.sin(t *= d) * k,
              A = Math.sin(d - t) * k,
              x = A * kx0 + B * kx1,
              y = A * ky0 + B * ky1,
              z = A * sy0 + B * sy1;
          return [
            Math.atan2(y, x) / d3_radians,
            Math.atan2(z, Math.sqrt(x * x + y * y)) / d3_radians
          ];
        }

        interpolate.distance = function() {
          if (d == null) {
            k = 1 / Math.sin(d = Math.acos(Math.max(-1, Math.min(1, sy0 * sy1 + cy0 * cy1 * Math.cos(x1 - x0)))));
          }
          return d;
        };

        interpolate.source = function(_) {
          var cx0 = Math.cos(x0 = _[0] * d3_radians),
              sx0 = Math.sin(x0);
          cy0 = Math.cos(y0 = _[1] * d3_radians);
          sy0 = Math.sin(y0);
          kx0 = cy0 * cx0;
          ky0 = cy0 * sx0;
          d = null;
          return interpolate;
        };

        interpolate.target = function(_) {
          var cx1 = Math.cos(x1 = _[0] * d3_radians),
              sx1 = Math.sin(x1);
          cy1 = Math.cos(y1 = _[1] * d3_radians);
          sy1 = Math.sin(y1);
          kx1 = cy1 * cx1;
          ky1 = cy1 * sx1;
          d = null;
          return interpolate;
        };

        return interpolate;
      },

      getAllItems() {
        var countries = [
          'United Arab Emirates',
          'Anguilla',
          'Albania',
          'American Samoa',
          'Austria',
          'Australia',
          'Belgium',
          'Bulgaria',
          'Bermuda',
          'Brazil',
          'Belarus',
          'Canada',
          'Switzerland',
          'Chile',
          'China',
          'Colombia',
          'Costa Rica',
          'Czechia',
          'Germany',
          'Denmark',
          'Dominican Rep.',
          'Estonia',
          'Egypt',
          'Spain',
          'Finland',
          'France',
          'United Kingdom',
          'Georgia',
          'Hong Kong',
          'Croatia',
          'Hungary',
          'Indonesia',
          'Ireland',
          'Israel',
          'India',
          'Italy',
          'Japan',
          'Kenya',
          'South Korea',
          'Lithuania',
          'Luxembourg',
          'Latvia',
          'Malta',
          'Mexico',
          'Malaysia',
          'Netherlands',
          'Norway',
          'New Zealand',
          'Panama',
          'Philippines',
          'Pakistan',
          'Poland',
          'Portugal',
          'Romania',
          'Serbia',
          'Russia',
          'Sweden',
          'Singapore',
          'Slovenia',
          'Slovakia',
          'Thailand',
          'Tunisia',
          'Turkey',
          'Ukraine',
          'United States of America',
          'Uruguay',
          'South Africa'
        ];

        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json', function(error, world) {
          var acountries = topojson.object(world, world.objects.countries).geometries;
          countryIds = [];
          countryNames = [];
          acountries.map(function(x, k) {
                if (countries.includes(x.properties.name)) {
                  countryIds.push(parseInt(x.id));
                  countryNames.push((x.properties.name));
                }
              }
          );
          countries.filter(function(x) {
            if (!countryNames.includes(x)) {
              return true;
            }
          });
        });
      }

    }
  });