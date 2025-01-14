class Histogram {
    margin = {
        top: 10, right: 10, bottom: 40, left: 40
    }

    constructor(svg, width = 250, height = 250) {
        this.svg = svg;
        this.width = width;
        this.height = height;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleBand();
        this.yScale = d3.scaleLinear();

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    update(data, xVar) {
        console.log(xVar)
        const categories = [...new Set(data.map(d => d[xVar]))]
        const counts = {}
        const setArr = Array.from(categories)
        
        const sortcat = new Set(setArr.sort())

        console.log(categories)
        console.log(sortcat)
        sortcat.forEach(c => {
            counts[c] = data.filter(d => d[xVar] === c).length;
        })
        // const sortcount = {}
        // Object.keys(counts).sort().reduce(
        //     (sortcount, key) => {
        //         sortcount[key] = counts[key];
        //         return sortcount;
        //     },
        //     {}
        // );
        // console.log(sortcount)

        this.xScale.domain(sortcat).range([0, this.width]).padding(0.3);
        this.yScale.domain([0, d3.max(Object.values(counts))]).range([this.height, 0]);
        
        this.container.selectAll("rect")
            .data(sortcat)
            .join("rect")
            .attr("x", d => this.xScale(d))
            .attr("y", d => this.yScale(counts[d]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.height - this.yScale(counts[d]))
            .attr("fill", "lightgray")
        // TODO: draw a histogram


        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale));

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale));
    }
}