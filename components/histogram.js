class Histogram {
    margin = {
        top: 10,
        right: 10,
        bottom: 40,
        left: 40,
    };

    constructor(svg, tooltip, colorMap, width = 250, height = 250) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.zScale = colorMap;
        this.width = width;
        this.height = height;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append('g');

        this.xAxis = this.svg.append('g');
        this.yAxis = this.svg.append('g');

        this.xScale = d3.scaleBand();
        this.yScale = d3.scaleLinear();

        this.svg
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);

        this.container.attr(
            'transform',
            `translate(${this.margin.left}, ${this.margin.top})`
        );
    }

    update(histogramData) {
        const categories = [...new Set(histogramData.map(d => d.fos))];
        const counts = {};
        categories.forEach(c => {
            counts[c] = 0;
            let group = histogramData.filter(d => d.fos === c);
            group.forEach(elem => (counts[c] += elem.paperNums));
        });

        this.xScale.domain(categories).range([0, this.width]).padding(0.3);
        this.yScale
            .domain([0, d3.max(Object.values(counts))])
            .range([this.height, 0]);

        let colorMap = this.zScale;
        let tooltip = this.tooltip;
        const Recthover = function (e, d) {
            tooltip
                .html(
                    `# of papers in<br/><strong style="color: ${colorMap(
                        d
                    )}">${d}</strong><br/>${counts[d]}`
                )
                .style('font-size', '0.8em')
                .style('border-radius', '8px')
                .style('text-align', 'center ')
                .style('display', 'block')
                .style('width', '150px')
                .style('left', e.pageX + 30)
                .style('top', e.pageY - 20);
        };
        this.container
            .selectAll('rect')
            .data(categories)
            .join('rect')
            .attr('x', d => this.xScale(d))
            .attr('y', d => this.yScale(counts[d]))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => this.height - this.yScale(counts[d]))
            .attr('value', d => counts[d])
            .attr('fill', d => this.zScale(d))
            .on('mouseover', Recthover)
            .on('mouseout', () => tooltip.style('display', 'none'));

        this.xAxis
            .attr(
                'transform',
                `translate(${this.margin.left}, ${
                    this.margin.top + this.height
                })`
            )
            .call(d3.axisBottom(this.xScale).tickFormat(() => ''));

        this.yAxis
            .attr(
                'transform',
                `translate(${this.margin.left}, ${this.margin.top})`
            )
            .call(d3.axisLeft(this.yScale));
    }
}
