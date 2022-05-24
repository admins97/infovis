class Tendency {
    margin = {
        top: 10,
        right: 10,
        bottom: 40,
        left: 40,
    };

    constructor(svg, tooltip, colorMap, width = 250, height = 250) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.width = width;
        this.height = height;
        this.zScale = colorMap;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append('g');
        this.xAxis = this.svg.append('g');
        this.yAxis = this.svg.append('g');
        this.legend = this.svg.append('g');

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();

        this.svg
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);

        this.container.attr(
            'transform',
            `translate(${this.margin.left}, ${this.margin.top})`
        );

        this.tooltipLine = this.container.append('line');
        this.tipBox = this.container
            .append('rect')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('opacity', 0);
    }

    update(tendencyData) {
        tendencyData = tendencyData.sort(function (a, b) {
            return b.year - a.year;
        });
        const sumstat = d3.group(tendencyData, d => d.fos);
        const yearRange = d3.extent(tendencyData, d => d.year);

        this.xScale
            .domain([yearRange[0] - 0.5, yearRange[1] + 0.5])
            .range([0, this.width]);
        this.yScale
            .domain(d3.extent(tendencyData, d => d.paperNums))
            .range([this.height, 0]);

        let h = this.height;
        let color = this.zScale;
        let yScale = this.yScale;
        let xScale = this.xScale;
        let tooltip = this.tooltip;
        let tooltipLine = this.tooltipLine;

        this.tipBox
            .on('mousemove', function (e, d) {
                const rel_x = this.getBoundingClientRect().x;
                const year = Math.round(xScale.invert(e.x - rel_x));
                tooltipLine
                    .attr('stroke', 'black')
                    .attr('x1', xScale(year))
                    .attr('x2', xScale(year))
                    .attr('y1', 0)
                    .attr('y2', h);

                let tooltipShow = tendencyData
                    .filter(d => d.year == year)
                    .sort(function (a, b) {
                        return b.paperNums - a.paperNums;
                    });
                tooltip
                    .html(`# of papers in ${year}`)
                    .style('font-size', '0.8em')
                    .style('font-weight', 'bold')
                    .style('border-radius', '10px')
                    .style('text-align', 'center ')
                    .style('display', 'block')
                    .style('width', '250px')
                    .style('left', e.pageX + 30)
                    .style('top', e.pageY - 20)
                    .selectAll()
                    .data(tooltipShow)
                    .join('div')
                    .style('color', d => color(d.fos))
                    .html(d => `${d.fos}: ${d.paperNums}`);
            })
            .on('mouseout', function (e, d) {
                tooltip.style('display', 'none');
                tooltipLine.attr('stroke', 'none');
            });

        this.container
            .selectAll('path')
            .data(sumstat)
            .join('path')
            .attr('fill', 'none')
            .attr('stroke', d => color(d[0]))
            .attr('stroke-width', 2.5)
            .attr('d', function (d) {
                return d3
                    .line()
                    .x(d => xScale(d.year))
                    .y(d => yScale(d.paperNums))(d[1]);
            });

        this.container
            .selectAll('circle')
            .data(tendencyData)
            .join('circle')
            .attr('cx', d => this.xScale(d.year))
            .attr('cy', d => this.yScale(d.paperNums))
            .attr('fill', d => this.zScale(d.fos))
            .attr('r', 5);

        this.xAxis
            .attr(
                'transform',
                `translate(${this.margin.left}, ${
                    this.margin.top + this.height
                })`
            )
            .transition()
            .call(
                d3
                    .axisBottom(this.xScale)
                    .ticks(yearRange[1] - yearRange[0] + 1)
                    .tickFormat(d3.format('.4'))
            );

        this.yAxis
            .attr(
                'transform',
                `translate(${this.margin.left}, ${this.margin.top})`
            )
            .transition()
            .call(d3.axisLeft(this.yScale));
    }
}
