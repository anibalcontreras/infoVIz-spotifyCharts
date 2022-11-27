const DATE_STREAMS_CSV = "https://gist.githubusercontent.com/anibalcontreras/d7a73a49c23be4a19d81ee4198b45964/raw/a3e191ede4abf99530cb1a6ffcf497a0665486e7/date_streams.csv"
const GLOBAL_ARTISTS_CSV = "https://gist.githubusercontent.com/anibalcontreras/7c9aacb7150c20eb2eb2449e6ce04985/raw/d61679f1f1ac2936f3568ad78f201df8939aa830/global_artists.csv"
const REGION_ARTISTS_CSV = "https://gist.githubusercontent.com/anibalcontreras/ec2c3a17fa422da7bcbe06e6e5e58fac/raw/cb958aaeb0b14c4d4f98d54c5ac59855c01a088a/artists_spotify_region.csv"

d3.csv(GLOBAL_ARTISTS_CSV, parseArtist).then((globalArtists) => {
    d3.csv(REGION_ARTISTS_CSV, parseArtist).then((regionArtists) => {
        d3.csv(DATE_STREAMS_CSV, parseDate).then((dateStreams) => {
            artistasRegionales = JSON.parse(JSON.stringify(regionArtists));
            dataViz_wordcloud(globalArtists, dateStreams);
        })
    })
})

function parseArtist(d) {
	const data = {
		region: d.region,
		text: d.text,
		streams: +d.streams,
		rank: +d.rank,
		percentage: +d.percentage,
		total_streams: +d.total_streams,
	}
    return data
}


function parseDate(d) {
    const data = {
        text: d.text,
        region: d.region,
        date: d.date,
        streams: +d.streams,
    }
    return data
}



function dataViz_wordcloud(data, date) {

    const wordG = d3.select("#viz1")
                .append("svg")
                .attr("width", 1400)
                .attr("height", 700)
                .style("border", '1px solid')
                .style("margin", '10px 10px')
                .style("color", '#1DB954')
                .selectAll("g")

    const artistTooltip = d3.select('#artists').append('div')
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #191414")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style('font-size', '10px')


	const colors = ["#a6cee3",
		"#1f78b4",
		"#b2df8a",
		"#33a02c",
		"#fb9a99",
		"#e31a1c",
		"#fdbf6f",
		"#ff7f00",
		"#cab2d6",
		"#6a3d9a",
		"#ffff99",
		"#b15928"]

    const sizeScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.streams)])
        .range([12, 120])
        d3.layout.cloud().size([1400, 700])
            .words(data)
            .fontSize(function (d) {
                return sizeScale(d.streams);
            })
            .padding(1)
            .on("end", draw)
            .start();
            
        function draw(words) {

            wordG
                .data(words)
                .join(enter => {

                    const enterSection = enter.append("g")

                    enterSection.append("text")
                        .style("font-size", function (d) {
                            return d.size + "px";
                        })
                        .style("fill", function (d) {
                            return colors[Math.floor(Math.random() * colors.length)];

                        })
                        .style("opacity", 1)
                        .attr("text-anchor", "middle")
                        .attr("transform", function (d) {
                            return "translate(" + [690 + d.x, 360 + d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(function (d) {
                            return d.text;
                        });

                    enterSection
                        .on('mouseover', (_, d) => {
                            enterSection.attr('opacity', (data) => data.text === d.text ? 1 : 0.6)
                            artistTooltip.style('visibility', 'visible')
                        })
                        .on('mousemove', (event, d) => {
                            artistTooltip
                            .style('top', `${event.pageY - 20}px`)
                            .style('left', `${event.pageX + 50}px`)
                            .html(`
                            <p><strong>Artista:</strong> ${d.text}</p>
                            <p><strong>Streams:</strong> ${d3.format(".2s")(d.streams)}</p>
                            <p><strong>Ranking:</strong>: ${d.rank}<p/>
                            `)
                        })
                        .on('mouseout', () => {
                            enterSection.attr('opacity', null)
                            artistTooltip.style('visibility', 'hidden')
                        })
                        .on('click', (_, d) => {
                            // console.log(d.text)
                            // console.log(d.region)
                            // Filter date where text = d.text and region = d.region
                            const filteredDate = date.filter((data) => data.text === d.text && data.region === d.region)
                            dataViz_linechart(filteredDate)
                            // console.log(d.text)
                            // console.log(d.region)
                            // updateArtists(d.text, d.region)
                            // enterSection.attr('opacity', (data) => data.text === d.text ? 1 : 0.6)
                        })
                    })
        d3.select("#select").on("change", (event) => {
            d3.select('#viz1').selectAll("*").remove();
            const value = event.target.value;
            const filterData = artistasRegionales.filter(d => d.region === value);
            // console.log(filterData)
            dataViz_wordcloud(filterData, date);
            })

    }

};


function dataViz_linechart(data) {
    d3.select('#viz2').selectAll("*").remove();
    console.log(data)
    
    const escalaY = d3
        .scaleLinear()
        .domain([d3.min(data, d => d.streams), d3.max(data, d => d.streams)])
        .range([400, 0])

    const escalaX = d3
        .scaleLinear()
        .domain([0, data.length])
        .range([0, 800])

    const line = d3.line()
        .x((d, i) => escalaX(i))
        .y(d => escalaY(d.streams))

    d3.select('#viz2')
        .append('h3')
        .text(`Cantidad de streams de ${data[0].text} en ${data[0].region}`)
        .style('text-align', 'center')
        .style('margin', '10px 10px')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('color', '#1DB954')

    const lineG = d3.select('#viz2')
        .append('svg')
        .attr('width', 1000)
        .attr('height', 500)
        .style('border', '1px solid')
        .style('margin', '10px 10px')
        .style('background-color', '#1DB954')
        .append('g')
        .attr('transform', 'translate(50, 50)')
        .selectAll('g')
        

    lineG
        .data(data)
        .join(enter => {
            // add a title
            enter.append('path')
                .attr('d', line(data))
                .attr('fill', 'none')
                .attr('stroke', '#191414')
        }
        )

    const xAxis = d3.axisBottom(escalaX)
        .tickFormat(() => '')


    const yAxis = d3.axisLeft(escalaY)
        .tickFormat(d3.format('.2s'))

    lineG
        .data(data)
        .join(enter => {
            enter.append('g')
                .attr('transform', `translate(0, ${400})`)
                .call(xAxis)
        }
        )

    lineG
        .data(data)
        .join(enter => {
            enter.append('g')
                .call(yAxis)
        }
        )

    const lineTooltip = d3.select('#viz2')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'white')
        .style('border', '1px solid')
        .style('border-radius', '5px')
        .style('padding', '10px')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('color', '#1DB954')

    lineG
        .data(data)
        .join(enter => {
            enter.append('g')
                .selectAll('circle')
                .data(data)
                .join('circle')
                .attr('cx', (d, i) => escalaX(i))
                .attr('cy', d => escalaY(d.streams))
                .attr('r', 5)
                .attr('fill', '#191414')
                .on('mouseover', (event, d) => {
                    lineTooltip.style('visibility', 'visible')
                    lineTooltip.html(`
                        <p><strong>Fecha:</strong> ${d.date}</p>
                        <p><strong>Streams:</strong> ${d3.format(".2s")(d.streams)}</p>
                        `)
                })
                .on('mousemove', (event) => {
                    lineTooltip.style('top', (event.pageY - 10) + 'px')
                        .style('left', (event.pageX + 10) + 'px')
                })
                .on('mouseout', () => {
                    lineTooltip.style('visibility', 'hidden')
                })
        }
        )

};