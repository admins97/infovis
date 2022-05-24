class Graph {
    margin = {
        top: 10,
        right: 10,
        bottom: 40,
        left: 40,
    };
    constructor(svg, tooltip, colorMap, width = 250, height = 250, rad = 4.5) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.colorMap = colorMap;
        this.width = width;
        this.height = height;
        this.rad = rad;
        this.timer = 0;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append('g');
        this.links = this.container.append('g');
        this.nodes = this.container.append('g');
        this.diffx = 0;
        this.diffy = 0;

        this.svg
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .style('background-color', 'white');

        this.container
            .attr(
                'transform',
                `translate(${this.margin.left}, ${this.margin.top})`
            )
            .attr('width', this.width)
            .attr('height', this.height);
        this.setZoom();
    }

    update(linksData, nodesData, selectedColor = 'transparent') {
        this.simulation = d3
            .forceSimulation(nodesData)
            .force('charge', d3.forceManyBody())
            .force('x', d3.forceX().strength(0.1))
            .force('y', d3.forceY().strength(0.1))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force(
                'collision',
                d3.forceCollide(d => d.degree)
            );

        let container = this.container;

        const link = this.links
            .attr('class', 'links')
            .selectAll('line')
            .data(linksData)
            .join('line')
            .attr('stroke-width', 1)
            .attr('stroke', '#999')
            .attr('marker-end', 'url(#arrow)');

        let w = this.width + this.margin.left + this.margin.right;
        let h = this.height + this.margin.top + this.margin.bottom;
        let tooltip = this.tooltip;
        let opacityScale = d3
            .scalePow()
            .exponent(0.2)
            .domain(d3.extent(nodesData, d => d.n_citation))
            .range([35, -5]);

        const colorMap = this.colorMap;
        const setD = (x, y) => {
            this.diffx = x;
            this.diffy = y;
        };
        const node = this.nodes
            .selectAll('circle')
            .data(nodesData)
            .join('circle')
            .on('click', function (e, d) {
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = 0;
                }
                switch (e.detail) {
                    case 1: // Single click
                        this.timer = setTimeout(function () {
                            function colorizeFoS(fos) {
                                let txt = '';
                                fos.forEach((elem, idx) => {
                                    txt += ` <span style="color: ${colorMap(
                                        elem
                                    )}">${elem}</span>`;
                                });
                                return txt;
                            }
                            let inner = tooltip.select('.tooltip-inner');
                            inner.html(
                                `<strong>Field of study</strong>: ${colorizeFoS(
                                    d.fos
                                )}<br/><strong>Title</strong>: <span style='color:gray'>${
                                    d.title
                                }</span><br/><strong>Authors</strong>: <span style='color:gray'>${
                                    d.authors
                                }</span><br/>
                                cited<strong> ${
                                    d.n_citation
                                }</strong> times<br/><span style='color:gray'>Published at ${
                                    d.venue
                                } in </span>${d.year}`
                            );
                            Popper.createPopper(e.target, inner.node(), {
                                placement: 'top',
                                modifiers: [
                                    {
                                        name: 'offset',
                                        options: {
                                            offset: [10, 5],
                                        },
                                    },
                                ],
                            });
                            if (tooltip.node().style.visibility === 'hidden') {
                                tooltip.style('visibility', 'visible');
                            } else {
                                tooltip.style('visibility', 'hidden');
                            }
                        }, 200);
                        break;
                    case 2: // Double click
                        let zoomTrans = d3.zoomTransform(container.node());
                        let dcx = w / 2 - d.x * zoomTrans.k;
                        let dcy = h / 2 - d.y * zoomTrans.k;
                        setD(dcx - zoomTrans.x, dcy - zoomTrans.y);
                        container.attr(
                            'transform',
                            `translate(${dcx},${dcy}) scale(${zoomTrans.k})`
                        );
                        break;
                }
            })
            .on('mousemove', function (d) {
                tooltip.style('visibility', 'hidden');
            })
            .attr('r', this.rad * 2)
            .attr('fill', selectedColor)
            // .attr('fill-opacity', d => this.opacityScale(d.id))
            .attr('fill', function (d) {
                return tinycolor(selectedColor)
                    .lighten(opacityScale(d.n_citation))
                    .toString();
            })
            .call(this.drag(this.simulation));

        this.simulation
            .force(
                'link',
                d3
                    .forceLink(linksData)
                    .id(d => d.id)
                    .distance(40)
            )
            .on('tick', () => {
                link.attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                node.attr('cx', d => d.x).attr('cy', d => d.y);
            });
    }
    setZoom() {
        let container = this.container;
        let zoom = d3.zoom().scaleExtent([0.1, 8]);
        const getDiff = () => {
            return [this.diffx, this.diffy];
        };
        this.svg
            .call(
                zoom.on('zoom', function (event) {
                    let diffs = getDiff();
                    container.attr(
                        'transform',
                        `translate(${diffs[0] + event.transform.x},${
                            diffs[1] + event.transform.y
                        }) scale(${event.transform.k})`
                    );
                })
            )
            .on('dblclick.zoom', null);
    }

    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
}
