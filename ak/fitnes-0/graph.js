const margin = { top: 40, right: 20, bottom: 50, left: 100 };
const graphWidth = 560 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', graphWidth + margin.left + margin.right)
    .attr('height', graphHeight + margin.top + margin.bottom)
;

const graph = svg.append('g')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
;

// scales
const x = d3.scaleTime().range([ 0, graphWidth ]);
const y = d3.scaleLinear().range([ graphHeight, 0 ]);

// axes groups
const xAxisGroup = graph.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${graphHeight})`)
;
const yAxisGroup = graph.append('g')
    .attr('class', 'y-axis')
;

const line = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(d.distance))
;
const path = graph.append('path');

const update = (data) => {
    console.log('update() data:', data);

    data = data.filter(v => v.activity === activity);
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // set scale domains
    x.domain(d3.extent(data, v => new Date(v.date)));
    y.domain([ 0, d3.max(data, v => v.distance) ]);

    // create axes
    const xAxis = d3.axisBottom(x).ticks(4).tickFormat(d3.timeFormat('%b %d'));
    const yAxis = d3.axisLeft(y).ticks(4).tickFormat(d => d + 'm');

    // create circles for objects
    const circles = graph.selectAll('circle').data(data);

    // remove unwanted points
    circles.exit().remove();

    // update current points
    circles
        .attr('cx', v => x(new Date(v.date)))
        .attr('cy', v => y(v.distance))
    ;

    // enter new points
    circles.enter()
        .append('circle')
            .attr('cx', v => x(new Date(v.date)))
            .attr('cy', v => y(v.distance))
            .attr('fill', '#ccc')
            .attr('r', 4)
    ;

    // call axes
    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    xAxisGroup.selectAll('text')
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end')
    ;

    path.data([ data ])
        .attr('fill', 'none')
        .attr('stroke', '#00bfa5')
        .attr('stroke-width', 2)
        .attr('d', line)
    ;
};

let data = [];
db.collection('activities').onSnapshot(res => {

    res.docChanges().forEach(change => {
        const doc = { ...change.doc.data(), id: change.doc.id };
        switch (change.type) {
            case 'added':
                data.push(doc);
                break;

            case 'modified':
                const index = data.findIndex(v => v.id === doc.id);
                data[index] = doc;
                break;

            case 'removed':
                data = data.filter(v => v.id !== doc.id);
                break;
        }
    });

    update(data);
});
