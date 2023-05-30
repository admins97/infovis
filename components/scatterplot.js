class Scatterplot {
    margin = {
        top: 10, right: 100, bottom: 40, left: 40
    }

    constructor(svg, tooltip, data, customData, width = 250, height = 250) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.data = data;
        this.customData = customData;
        this.width = width;
        this.height = height;

        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        this.zScale = d3.scaleOrdinal().range(d3.schemeCategory10)

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start brush", (event) => {
            this.brushCircles(event);
            })

        // TODO: create a brush object, set [[0, 0], [this.width, this.height]] as the extent, and bind this.brushCircles as an event listenr
    }

    update(xVar, yVar, colorVar, useColor, xVar_f, yVar_f, movieid) {
        this.xVar = xVar;
        this.yVar = yVar;
        this.xVar_f = xVar_f;
        this.yVar_f = yVar_f;
        this.movieid = movieid;

        // const movieNum = [...new Set(this.data.map(d => d[movieid]).filter((f) => f))]
        //     .filter((m) => )
        
        const movieNum = [...new Set(data.map(d => d[this.movieid]))]       
        const mean = {}
        const movieYear = {}

        // movieNum.forEach(m => {
        //     mean[m] = d3.mean(this.data.filter(d => d[]))
        // })

        movieNum.forEach(m => {
            //'movieNum': m,
            movieYear[m] = d3.max(this.data.filter(d => d[movieid] === m && d[xVar] >= this.xVar_f), d => d[xVar]),
            mean[m] = d3.mean(this.customData.filter(d => d[movieid] === m && d[yVar] >= this.yVar_f), d => d[yVar])

        })

        const subject = {movieYear, mean};
        // console.log(subject)

        this.xScale.domain([xVar_f, d3.max(Object.values(movieYear))]).range([0, this.width]).nice();
        this.yScale.domain([yVar_f, d3.max(Object.values(mean))]).range([this.height, 0]);
        this.zScale.domain([...new Set(this.data.map(d => d[colorVar]))])

        this.circles = this.container.selectAll("circle")
            .data(movieNum)
            .join("circle")
            .on("mouseover", (e, d) => {
                this.tooltip.select(".tooltip-inner")
                    .html(`${this.xVar}: ${mean[d]}<br />${this.yVar}: ${mean[d]}`);

                Popper.createPopper(e.target, this.tooltip.node(), {
                    placement: 'top',
                    modifiers: [
                        {
                            name: 'arrow',
                            options: {
                                element: this.tooltip.select(".tooltip-arrow").node(),
                            },
                        },
                    ],
                });

                this.tooltip.style("display", "block");
            })
            .on("mouseout", (d) => {
                this.tooltip.style("display", "none");
            });


        this.circles
            .transition()
            .attr("cx", d => this.xScale(movieYear[d]))
            .attr("cy", d => this.yScale(mean[d]))
            .attr("fill", useColor ? d => this.zScale(d[colorVar]) : "black")
            .attr("r", 3)


        this.container.call(this.brush);

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .transition()
            .call(d3.axisBottom(this.xScale));

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .transition()
            .call(d3.axisLeft(this.yScale));

        if (useColor) {
            this.legend
                .style("display", "none")
                .style("font-size", ".8em")
                .attr("transform", `translate(${this.width + this.margin.left + 10}, ${this.height / 2})`)
                .call(d3.legendColor().scale(this.zScale))
        }
        else {
            this.legend.style("display", "none");
        }
    }

    isBrushed(d, selection) {
        // console.log(d)
        // d[0], d[1]
        let [[x0, y0], [x1, y1]] = selection; // destructuring assignment
        let x = this.xScale(d[this.xVar]);
        let y = this.yScale(d[this.yVar]);
        return x0 <= x && x <= x1 
        // && y0 <= y && y <= y1;
        // TODO: return true if d's coordinate is inside the selection
    }

    // this method will be called each time the brush is updated.
    brushCircles(event) {
        let selection = event.selection;

        this.circles.classed("brushed", d => this.isBrushed(d, selection));

        if (this.handlers.brush)
            this.handlers.brush(this.data.filter(d => this.isBrushed(d, selection)));
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}