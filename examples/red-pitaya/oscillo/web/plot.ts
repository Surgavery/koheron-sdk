// Plot
// (c) Koheron

class Plot {

    private ch1Checkbox: HTMLInputElement;
    private ch2Checkbox: HTMLInputElement;

    private plot: jquery.flot.plot;
    private options: jquery.flot.plotOptions;
    private isResetRange: boolean;

    private minY: number;
    private maxY: number;
    private rangeY: jquery.flot.range;

    private hoverDatapointSpan: HTMLSpanElement;
    private hoverDatapoint: number[];

    private clickDatapointSpan: HTMLSpanElement;
    private clickDatapoint: number[];

    constructor(document: Document, private plot_placeholder: JQuery, private driver: Oscillo) {
        this.ch1Checkbox = <HTMLInputElement>document.getElementById('ch1-checkbox');
        this.ch2Checkbox = <HTMLInputElement>document.getElementById('ch2-checkbox');

        this.setPlot();

        this.minY = -8192;
        this.maxY = +8191;

        this.rangeY = {
            from: this.minY,
            to: this.maxY
        };

        this.driver.setTimeRange({
            from : 0,
            to   : this.driver.maxT
        });

        this.hoverDatapointSpan = <HTMLSpanElement>document.getElementById("hover-datapoint");
        this.hoverDatapoint = [];

        this.clickDatapointSpan = <HTMLSpanElement>document.getElementById("click-datapoint");
        this.clickDatapoint = [];

        this.updatePlot();

    }

    updatePlot() {
        this.driver.getDecimatedData( (ch0: number[][], ch1: number[][], rangeX: jquery.flot.range) => {
            this.redraw(ch0, ch1, rangeX, () => {
                requestAnimationFrame( () => {
                    this.updatePlot();
                });
            });
        });
    }

    // == Plot

    setPlot(): void {
        this.isResetRange = false;

        this.options = {
            series: {
                shadowSize: 0 // Drawing is faster without shadows
            },
            yaxis: {
                min: this.minY,
                max: this.maxY
            },
            xaxis: {
                min: 0,
                max: this.driver.maxT,
                show: true
            },
            grid: {
                margin: {
                    top: 0,
                    left: 0,
                },
                borderColor: "#d5d5d5",
                borderWidth: 1
            },
            selection: {
                mode: 'xy'
            },
            colors: ['#019cd5', '#d53a01']
        }

        this.rangeSelect();
        this.dblClick();
        this.onWheel();
        this.isResetRange = true;
    }

    rangeSelect(): void {
        this.plot_placeholder.bind('plotselected', (event: JQueryEventObject,
                                               ranges: jquery.flot.ranges) => {
            // Clamp the zooming to prevent external zoom
            if (ranges.xaxis.to - ranges.xaxis.from < 0.00001) {
                ranges.xaxis.to = ranges.xaxis.from + 0.00001;
            }

            if (ranges.yaxis.to - ranges.yaxis.from < 0.00001) {
                ranges.yaxis.to = ranges.yaxis.from + 0.00001;
            }

            this.rangeY = {
                from: ranges.yaxis.from,
                to: ranges.yaxis.to
            };

            this.driver.setTimeRange(ranges.xaxis);
            this.resetRange();
        });
    }

    // A double click on the plot resets to full span
    dblClick(): void {
        this.plot_placeholder.bind('dblclick', (evt: JQueryEventObject) => {
            const rangeX: jquery.flot.range = {
                from : 0,
                to   : this.driver.maxT
            };

            this.rangeY = <jquery.flot.range>{};
            this.driver.setTimeRange(rangeX);
            this.resetRange();
        });
    }

    autoScale(): void {
        const rangeX = {
            from : 0,
            to   : this.driver.maxT
        };

        this.rangeY = <jquery.flot.range>{};
        this.driver.setTimeRange(rangeX);
        this.resetRange();
    }

    onWheel(): void {
        this.plot_placeholder.bind('wheel', (evt: JQueryEventObject) => {
            let delta: number = (<JQueryMousewheel.JQueryMousewheelEventObject>evt.originalEvent).deltaX
                                + (<JQueryMousewheel.JQueryMousewheelEventObject>evt.originalEvent).deltaY;
            delta /= Math.abs(delta);

            const zoomRatio: number = 0.2;

            if ((<JQueryInputEventObject>evt.originalEvent).shiftKey) { // Zoom Y
                const positionY: number = (<JQueryMouseEventObject>evt.originalEvent).pageY - this.plot.offset().top;
                const y0: any = this.plot.getAxes().yaxis.c2p(<any>positionY);

                this.rangeY = {
                    from: y0 - (1 + zoomRatio * delta) * (y0 - this.plot.getAxes().yaxis.min),
                    to: y0 - (1 + zoomRatio * delta) * (y0 - this.plot.getAxes().yaxis.max)
                };

                this.resetRange();
                return false;
            } else if ((<JQueryInputEventObject>evt.originalEvent).altKey) { // Zoom X
                const positionX: number = (<JQueryMouseEventObject>evt.originalEvent).pageX - this.plot.offset().left;
                const t0: any = this.plot.getAxes().xaxis.c2p(<any>positionX);

                if (t0 < 0 || t0  > this.driver.maxT) {
                    return;
                }

                // To avoid getting stuck at the edge
                if (this.plot.getAxes().xaxis.max - t0 < 2e6 / this.driver.samplingRate) {
                    delta = 4 * delta;
                }

                const rangeX: jquery.flot.range = {
                    from: Math.max(t0 - (1 + zoomRatio * delta) * (t0 - this.plot.getAxes().xaxis.min), 0),
                    to: Math.min(t0 - (1 + zoomRatio * delta) * (t0 - this.plot.getAxes().xaxis.max), this.driver.maxT)
                };

                this.driver.setTimeRange(rangeX);
                this.resetRange();
                return false;
            }

            return true
        });
    }

    resetRange(): void {
        this.isResetRange = true;
    }

    redraw(ch0: number[][], ch1: number[][],
           rangeX: jquery.flot.range, callback: () => void): void {

        if (ch0.length === 0 || ch1.length === 0) {
            callback();
            return;
        }

        let plotCh0: number[][] = [];
        let plotCh1: number[][] = [];

        if (this.ch1Checkbox.checked && this.ch2Checkbox.checked) {
            plotCh0 = ch0;
            plotCh1 = ch1;
            // plotData = [ch0, ch1];
        } else if (this.ch1Checkbox.checked && !this.ch2Checkbox.checked) {
            plotCh0 = ch0;
            plotCh1 = [];
        } else if (!this.ch1Checkbox.checked && this.ch2Checkbox.checked) {
            plotCh0 = [];
            plotCh1 = ch1;
        } else {
            plotCh0 = [];
            plotCh1 = [];
        }

        const plt_data: jquery.flot.dataSeries[] = [{label: "Channel 1 - Voltage", data: plotCh0}, {label: "Channel 2 - Voltage", data: plotCh1}];

        if (this.isResetRange) {
            this.options.xaxis.min = rangeX.from;
            this.options.xaxis.max = rangeX.to;
            this.options.yaxis.min = this.rangeY.from;
            this.options.yaxis.max = this.rangeY.to;

            this.plot = $.plot(this.plot_placeholder, plt_data, this.options);

            this.plot.setupGrid();
            this.isResetRange = false;
        } else {
            this.plot.setData(plt_data);
            this.plot.draw();
        }

        callback();
    }

}