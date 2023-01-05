import * as d3 from "d3"
import * as topojson from "topojson-client"
import { Color } from "./color"
import { percentLinear } from "./util";


// Constants

const MAP_DATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const EDU_DATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const LOW_EDU_COLOR: Color = Object.freeze({r: 225, g: 255, b: 225, a: 255});
const HIGH_EDU_COLOR: Color = Object.freeze({r: 10, g: 80, b: 32, a: 255});

const LEGEND_WIDTH = 300;
const LEGEND_TICK_HEIGHT = 16;
const LEGEND_OFFSET_X = 480;
const LEGEND_OFFSET_Y = 20;


// Get json data from url. Blocking function.
function getData(url: string) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();

    return (xhr.status !== 200) ?
        null :
        JSON.parse(xhr.response);
}

// Educational attainment info for one county
interface EduData {
    fips: number;
    state: string;
    area_name: string;
    bachelorsOrHigher: number
}

// Gets the edu object from the array by id
function findEduById(id: number | string, eduData: Array<EduData>) {
    if (typeof id === "string")
        id = parseInt(id);
    const edu = eduData.find(d => d.fips === id);

    return edu ? edu : null;
}

// Returns color for edu percentage
function getColorFromEdu(edu: number, minEdu: number, maxEdu: number) {
    const percent = percentLinear(edu, minEdu, maxEdu);

    const color = Color.lerp(LOW_EDU_COLOR, HIGH_EDU_COLOR, percent);

    return Color.toString(color);
}

// Main program
function main() {

    // ----- Get data -----
    const mapData = getData(MAP_DATA_URL) as TopoJSON.Topology;
    const countyData = topojson.feature(mapData, mapData.objects.counties) as d3.ExtendedFeatureCollection;
    const eduData = getData(EDU_DATA_URL) as Array<EduData>;

    const [eduMin, eduMax] = d3.extent(eduData, d => d.bachelorsOrHigher);

    const path = d3.geoPath();


    // ----- Create app -----
    const app = d3.select("body").append("div")
        .attr("id", "app");
    
    const svg = app.append("svg")
        .attr("id", "graph")
        .attr("class", "graph")
        .attr("width", mapData.bbox[2])
        .attr("height", mapData.bbox[3]);


    // ----- Create tooltip -----
    const tooltip = app.append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip");
    tooltip.append("p")
        .attr("class", "description");


    // ----- Create legend -----
    const legendScale = d3.scaleLinear()
        .domain([3, 66])    
        .range([0, LEGEND_WIDTH]);
    const legendTickValues = [3, 12, 21, 30, 39, 48, 57, 66];
    const legendRectValues = legendTickValues.slice(0, legendTickValues.length - 1);
    const legendAxis = d3.axisBottom(legendScale)
        .tickValues(legendTickValues)
        .tickSize(LEGEND_TICK_HEIGHT)
        .tickFormat((d, i) => legendTickValues[i] + "%");
    
    const legend = svg.append("g")
        .attr("id", "legend");

    legend.selectAll("rect")
        .data(legendRectValues)
        .enter()
        .append("rect")
            .attr("width", LEGEND_WIDTH / legendRectValues.length)
            .attr("height", LEGEND_TICK_HEIGHT - 6)
            .attr("x", (d, i) => LEGEND_WIDTH / legendRectValues.length*i)
            .attr("y", 1)
            .attr("fill", d => getColorFromEdu(d, eduMin, eduMax));
    legend
        .attr("transform", `translate(${LEGEND_OFFSET_X}, ${LEGEND_OFFSET_Y})`)
        .call(legendAxis);


    // ----- Create the counties -----
    const counties = svg.append("g").selectAll("path")
        .data(countyData.features)
        .enter()
        .append("path")
            .attr("d", path)
            .attr("class", "county")
            .attr("data-fips", d => d.id)
            .property("eduInfo", d => {
                return findEduById(d.id, eduData);
            })
            .attr("data-education", function() {
                const edu = d3.select(this).property("eduInfo") as EduData;
                return edu ? edu.bachelorsOrHigher : -1;
            })
            .attr("data-county-name", function(d) {
                const edu = d3.select(this).property("eduInfo") as EduData;
                return edu ? edu.area_name : "";
            })
            .attr("data-state", function(d) {
                const edu = d3.select(this).property("eduInfo") as EduData;
                return edu ? edu.state : "";
            })
            .attr("fill", function(d) {
                const edu = d3.select(this).attr("data-education");

                return getColorFromEdu(parseFloat(edu), eduMin, eduMax);
            }) 
            // callbacks
            .on("mouseover", function(event, d) {
                const county = d3.select(this);
                tooltip.select(".description")
                    .text(county.attr("data-county-name") + ", " + county.attr("data-state") + ": " +
                        county.attr("data-education") + "%");
                tooltip
                    .style("left", county.node().getBoundingClientRect().left + window.scrollX + 48 + "px")
                    .style("top", county.node().getBoundingClientRect().top + window.scrollY + "px")
                    .style("visibility", "visible")
                    .attr("data-education", county.attr("data-education"));
            })
            .on("mouseleave", function(event, d) {
                tooltip.style("visibility", "hidden");
            });


    // ----- State lines mesh -----
    const states = svg.append("path")
        .datum(topojson.mesh(mapData, mapData.objects.states, (first, second) => first !== second))
        .attr("class", "states")
        .attr("d", path)
        .attr("fill", "transparent")
        .attr("stroke", "white")
        .style("pointer-events", "none");

}

main();
