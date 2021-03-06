const request = require('request');
const CONFIGURATION = require('./configuration');
const fs = require('fs');
const TurndownService = require('turndown');
const turndownService = new TurndownService();
const path = require('path');

getRequest = (options, json = true) => new Promise((resolve, reject) => {
    request.get(options, function (err, resp, body) {
        if (err) {
            reject(err);
        } else {
            if (json) {
                resolve(JSON.parse(body));
            } else {
                resolve(body);
            }
        }
    });
});

async function main(projectId, type) {
    // Setting URL and headers for request
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': CONFIGURATION.authToken
    }
    const options = {
        url: CONFIGURATION.apiUrl + 'projects/' + projectId + '/work_packages',
        method: 'GET',
        headers: headers,
    }
    await getRequest(options).then(async function (response) {
        const totalWorkPackages = response.total;
        let totalLength = Number(totalWorkPackages) / 50;
        totalLength = Math.trunc(totalLength) + 1;
        let total = totalWorkPackages;
        let offset = 0;
        for (let i = 0; i < totalLength; i++) {
            offset = i + 1;
            options.url = CONFIGURATION.apiUrl + 'projects/' + projectId + '/work_packages?offset=' + offset + '&pageSize=' + 50;
            await getRequest(options).then(async function (result) {
                workPackages = result['_embedded']['elements'];
                for (const item of workPackages) {
                    if (item['_links']['attachments']) {
                        let mdContent = '';
                        let sourceBaseUrl = '';
                        sourceBaseUrl = item[CONFIGURATION.cleanUrlField];
                        if (sourceBaseUrl) {
                            sourceBaseUrl = sourceBaseUrl.split('/');
                            sourceBaseUrl = sourceBaseUrl[2];
                        }
                        var title = item['subject'].replace(/[^\x20-\x7E]/g, '');
                        mdContent = "--- \ntitle: " + '"' + title + '"' + "\ncleanUrl: " + '"' + item[CONFIGURATION.cleanUrlField] + "" + '"' + "\n";
                        if (type !== 'events') {
                            mdContent = mdContent + "date: " + '"' + item['createdAt'] + "" + '"' + "\n";
                        }
                        mdContent = mdContent + "sourceBaseUrl: " + '"' + sourceBaseUrl + '"' + "\n";
                        if (item['startDate']) {
                            mdContent = mdContent + "date: " + item['startDate'] + "\n";
                            mdContent = mdContent + "eventdate: " + item['startDate'] + "\n";
                            mdContent = mdContent + "publishdate: " + item['createdAt'] + "\n";
                        }
                        if (item['dueDate']) {
                            mdContent = mdContent + "enddate: " + item['dueDate'] + "\n";
                        }
                        if (item[CONFIGURATION.locationField]) {
                            mdContent = mdContent + "location: " + '"' + item[CONFIGURATION.locationField] + '"' + "\n";
                        }
                        if (type === 'events') {
                            mdContent = mdContent + "layout: " + '"' + "event" + '"' + "\n";
                            mdContent = mdContent + "sub: " + '"' + "events" + '"' + "\n";
							mdContent = mdContent + "eventCancelled: " + '"' + item[CONFIGURATION.eventCancelledField] + '"' + "\n";
                        }
                        let attachMentUrl = item['_links']['attachments']['href'];
                        attachMentUrl = CONFIGURATION.baseUrl + attachMentUrl;
                        options.url = attachMentUrl;
                        await getRequest(options).then(async function (response) {
                            if (response['_embedded']['elements'].length > 0) {
                                const elements = response['_embedded']['elements'];
                                let mdFileName = item['subject'].replace(/[^a-z\d\s]+/gi, " ");
                                mdFileName = mdFileName.trim();
                                let featuredImageUrl = '';
								let pdfUrl = '';
                                let metaDataUrl = '';
                                let ogSiteName = '';
								let attachment_title = '';
								let curated_attachment_basename = '';
								let curated_attachment_extension = '';
								let extension_img = '';
								let imagePath = '';
								let pdfPath = '';
                                elements.some(function (attachment, index, _arr) {
                                    if (attachment['_links']['self']['title']) {
										attachment_title = attachment['_links']['self']['title'];
										curated_attachment_extension = path.extname(attachment_title);
										curated_attachment_basename = path.basename(attachment_title, curated_attachment_extension);							
										if (attachment_title === 'Curated_Featured_Image.pdf') {
                                            pdfUrl = attachment['_links']['self']['href'];
                                            pdfUrl = CONFIGURATION.baseUrl + pdfUrl + '/content';
                                        }else if(curated_attachment_basename == 'Curated_Featured_Image') {
                                            featuredImageUrl = attachment['_links']['self']['href'];
                                            featuredImageUrl = CONFIGURATION.baseUrl + featuredImageUrl + '/content';
											extension_img = path.extname(attachment_title);
                                        }else if (attachment_title === 'Lectio_Extension_Curation.json') {
                                            metaDataUrl = attachment['_links']['self']['href'];
                                            metaDataUrl = CONFIGURATION.baseUrl + metaDataUrl + '/content';
                                        }						
                                    }
                                });
                                if (featuredImageUrl !== '' && extension_img !== '') {
                                    options.url = featuredImageUrl;
                                    options['encoding'] = 'binary';
                                    await getRequest(options, false).then(async function (responseData) {
                                        let fileName = item['subject'].replace(/[^a-z\d\s]+/gi, "");
                                        fileName = fileName.trim();
                                        fileName = fileName + extension_img;
                                        imagePath = "/images/resources/" + fileName;
                                        mdContent = mdContent + "banner : " + '"' + imagePath + '"' + "\n";
                                        fs.writeFile("static/images/resources/" + fileName, responseData, 'binary', function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(fileName, "-image is saved!");
                                            }
                                        });
                                    });
                                } else {
                                    imagePath = "images/default.png";
                                    mdContent = mdContent + "banner: " + '"' + imagePath + '"' + "\n";
                                    fs.writeFile('content/' + type + '/' + mdFileName + '.md', mdContent, function (err) {
                                        if (err) { throw err } else {
                                            console.log(mdFileName, 'Saved successfully!');
                                        }
                                    });
                                }
								if (pdfUrl !== '') {
                                    options.url = pdfUrl;
                                    options['encoding'] = 'binary';
                                    await getRequest(options, false).then(async function (responseData) {
                                        let pdfFileName = item['subject'].replace(/[^a-z\d\s]+/gi, "");
                                        pdfFileName = pdfFileName.trim();
                                        pdfFileName = pdfFileName + '.pdf';
                                        pdfPath = "/images/resources/" + pdfFileName;
                                        mdContent = mdContent + "pdfURL : " + '"' + pdfPath + '"' + "\n";
                                        fs.writeFile("static/images/resources/" + pdfFileName, responseData, 'binary', function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(pdfFileName, "-pdf is saved!");
                                            }
                                        });
                                    });
                                } 
                                if (metaDataUrl !== '') {
                                    options.url = metaDataUrl;
                                    await getRequest(options, false).then(async function (metaDataResponse) {
                                        metaDataResponse = JSON.parse(metaDataResponse);
                                        for (const meta of metaDataResponse) {
                                            if (meta['name'] === 'openGraphMetaData') {
                                                const openGraphMetaData = meta['content'];
                                                for (const openMeta of openGraphMetaData) {
                                                    openMeta['content'] = openMeta['content'].replace(/[^\x20-\x7E]/g, '');
                                                    openMeta['content'] = openMeta['content'].replace(/"/g, '\\"');
                                                    if (openMeta['name'] === 'og:title') {
                                                        mdContent = mdContent + "ogTitle: " + '"' + openMeta['content'] + '"' + "\n";
                                                    } else if (openMeta['name'] === 'og:description') {
                                                        mdContent = mdContent + "ogDescription: " + '"' + openMeta['content'] + '"' + "\n";
                                                    } else if (openMeta['name'] === 'og:type') {
                                                        mdContent = mdContent + "ogType: " + '"' + openMeta['content'] + '"' + "\n";
                                                    } else if (openMeta['name'] === 'og:site_name') {
                                                        ogSiteName = openMeta['content'];
                                                        mdContent = mdContent + "ogSiteName: " + '"' + openMeta['content'] + '"' + "\n";
                                                    } else if (openMeta['name'] === 'og:image') {
                                                        /*mdContent = mdContent + "ogImage: " + '"' + openMeta['content'] + '"' + "\n";*/
														mdContent = mdContent + "ogImage: " + '"' + imagePath + '"' + "\n";
                                                    }
                                                }
                                            }
                                            if (meta['name'] === 'twitterMetaData') {
                                                const twitterMetaData = meta['content'];
                                                for (const twitterMeta of twitterMetaData) {
                                                    twitterMeta['content'] = twitterMeta['content'].replace(/[^\x20-\x7E]/g, '');
                                                    twitterMeta['content'] = twitterMeta['content'].replace(/"/g, '\\"');
                                                    if (twitterMeta['name'] === 'twitter:card') {
                                                        mdContent = mdContent + "twitterCard: " + '"' + twitterMeta['content'] + '"' + "\n";
                                                    } else if (twitterMeta['name'] === 'twitter:description') {
                                                        mdContent = mdContent + "twitterDescription: " + '"' + twitterMeta['content'] + '"' + "\n";
                                                    } else if (twitterMeta['name'] === 'twitter:title') {
                                                        mdContent = mdContent + "twitterTitle: " + '"' + twitterMeta['content'] + '"' + "\n";
                                                    } else if (twitterMeta['name'] === 'twitter:site') {
                                                        mdContent = mdContent + "twitterSite: " + '"' + twitterMeta['content'] + '"' + "\n";
                                                    } else if (twitterMeta['name'] === 'twitter:image') {
                                                        /*mdContent = mdContent + "twitterImage: " + '"' + twitterMeta['content'] + '"' + "\n";*/
														mdContent = mdContent + "twitterImage: " + '"' + imagePath + '"' + "\n";
                                                    } else if (twitterMeta['name'] === 'twitter:creator') {
                                                        mdContent = mdContent + "twitterCreator: " + '"' + twitterMeta['content'] + '"' + "\n";
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                                if (ogSiteName) {
                                    const siteName = ogSiteName.replace(/\s/g, '-');
                                    const sourcePath = '/' + type + '/source/' + siteName.toLowerCase();
                                    mdContent = mdContent + "breadcrumbs:\n - Home\n - " + type.charAt(0).toUpperCase() + type.slice(1) + "\n - " + mdFileName + "\n";
                                    mdContent = mdContent + "breadcrumbLinks:\n - / \n - /" + type + "\n - / \n";
                                    mdContent = mdContent + "source: " + '"' + ogSiteName + '"' + "\n";
                                    mdContent = mdContent + type + "/source: " + '"' + ogSiteName + '"' + "\n";
                                } else {
                                    mdContent = mdContent + "breadcrumbs:\n - Home\n - " + type.charAt(0).toUpperCase() + type.slice(1) + "\n - " + mdFileName + "\n";
                                    mdContent = mdContent + "breadcrumbLinks:\n - / \n - /" + type + "\n - / \n";
                                }

                                mdContent = mdContent + "---\n" + turndownService.turndown(item['description']['raw'].replace(/[^\x20-\x7E]/g, '')) + "\n";
                                fs.writeFile('content/' + type + '/' + mdFileName + '.md', mdContent, function (err) {
                                    if (err) { throw err } else {
                                        console.log(mdFileName, 'Saved successfully!');
                                    }
                                });
                            }
                        });
                    }
                };
            }, function (err) {
                console.log(err);
            });
        }

        // totalLength = Number(totalLength) + 1;
    }, function (err) {
        console.log(err);
    })
}

const fetchNews = main(CONFIGURATION.newsProjectId, 'news');
fetchNews.then(function (newsResponse) {
    console.log('news completed..');
    const fetchEvents = main(CONFIGURATION.eventProjectId, 'events');
    fetchEvents.then(function (eventResponse) {
        console.log('events completed..');
        const fetchPress = main(CONFIGURATION.pressProjectId, 'press');
        fetchPress.then(function (pressResponse) {
            console.log('press completed..');
        });
    });
});