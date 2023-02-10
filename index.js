// metaradar.io | Activity Lambda function
// This file is part of the metardar.io project.
// Author: Ralph Kuepper
// Contact: info@metaradar.io
// License: MIT

const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_AKEY,
    secretAccessKey: process.env.AWS_SKEY,
    region: 'us-east-1'
});

exports.handler = async function (event, context) {
    let request = event;
    let address = request.queryStringParameters.address;
    let data = JSON.parse(request.body);
    var con = await mysql.createConnection({
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DB
	});

    let sql1 = "INSERT INTO logs (text) VALUES(?)";
    let res2 = await con.execute(sql1, [request.body]);

    
    let aevent = data.event;
    let network = "";
    if (aevent.network == "MATIC_MAINNET") {
        network = "polygon";
    }
    else if (aevent.network == "ETH_MAINNET") {
        network = "ethereum";
    }

    var sql = "SELECT * FROM addresses WHERE address = ? AND network = ?";
    
    let res = await con.execute(sql, [address, network]);
    let json = JSON.stringify(aevent.activity);
    if (res[0].length > 0) {
        for (let activity of aevent.activity) {
            let sql = "INSERT INTO notifications (addressId, address, email, content, title, json, status, views, clicks, notificationDate, network) VALUES(?, ?, ?, ?, ?, ?, 1,0,0, NOW(), network)";
            let adr = res[0][0];


            var sendEmail = false;
            var sendError = true;
            let title = "New Activity";
            let content = "Data: " + json;

            console.log("activity: ", activity);
            let transactionLink = "https://etherscan.io/tx/" + activity.hash;
            if (aevent.network == "MATIC_MAINNET") {
                transactionLink = "https://polygonscan.com/tx/" + activity.hash;
            }

            if (activity.category == "external") {
                if (activity.value == 0) {
                    sendError = false;
                }
                else {
                    sendError = false;
                    if (activity.fromAddress.toLowerCase() == address.toLowerCase()) {
                        title = activity.value + " " + activity.asset + " was moved out of " + activity.fromAddress;
                        content = "You, or somebody, moved " + activity.asset + " out of your address " + activity.fromAddress + " to the address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                    else if (activity.toAddress.toLowerCase() == address.toLowerCase()) {
                        title = activity.value + " " + activity.asset + " was moved into " + activity.toAddress;
                        content = "You, or somebody, moved " + activity.asset + " into your address " + activity.toAddress + " from address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                }

            }
            else if (activity.category == "internal") {
                if (activity.value == 0) {
                    sendError = false;
                }
                else {
                    sendError = false;
                    if (activity.fromAddress.toLowerCase() == address.toLowerCase()) {
                        title = activity.value + " " + activity.asset + " was moved out of " + activity.fromAddress;
                        content = "You, or somebody, moved " + activity.asset + " out of your address " + activity.fromAddress + " to the address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                    else if (activity.toAddress.toLowerCase() == address.toLowerCase()) {
                        title = activity.value + " " + activity.asset + " was moved into " + activity.toAddress;
                        content = "You, or somebody, moved " + activity.asset + " into your address " + activity.toAddress + " from address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                }

            }
            else if (activity.category == "token") {
                sendError = false;
                if (activity.erc721TokenId) {
                    if (activity.fromAddress.toLowerCase() == address.toLowerCase()) {
                        title = parseInt(activity.erc721TokenId, 16) + " (NFT) was moved out of " + activity.fromAddress;
                        content = "You, or somebody, moved " + parseInt(activity.erc721TokenId, 16) + " (NFT) out of your address " + activity.fromAddress + " to the address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                    else if (activity.toAddress.toLowerCase() == address.toLowerCase()) {
                        title = parseInt(activity.erc721TokenId, 16) + " (NFT) was moved into " + activity.toAddress;
                        content = "You, or somebody, moved " + parseInt(activity.erc721TokenId, 16) + " (NFT) into your address " + activity.toAddress + " from address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                }
                else {
                    if (activity.fromAddress.toLowerCase() == address.toLowerCase()) {
                        title = activity.value + " " + activity.asset + " was moved out of " + activity.fromAddress;
                        content = "You, or somebody, moved " + activity.asset + " out of your address " + activity.fromAddress + " to the address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                    else if (activity.toAddress.toLowerCase() == address.toLowerCase()) {
                        title = activity.value + " " + activity.asset + " was moved into " + activity.toAddress;
                        content = "You, or somebody, moved " + activity.asset + " into your address " + activity.toAddress + " from address: " + activity.toAddress;
                        content += "\n\nCheckout the transaction: " + transactionLink;
                        sendEmail = true;
                    }
                }


            }
            else if (activity.category == "erc1155") {
                sendError = false;
                let m = activity.erc1155Metadata;
                if (m.length == 1) {
                    let item = m[0];
                    let tokenId = parseInt(item.tokenId, 16);
                    let number = parseInt(item.value, 16);
                    if (activity.fromAddress.toLowerCase() == address.toLowerCase()) {
                        title = "#" + tokenId + " ERC1155 NFT has moved out of your address " + activity.fromAddress;

                    }
                    else if (activity.toAddress.toLowerCase() == address.toLowerCase()) {
                        title = "#" + tokenId + " ERC1155 NFT has moved into your address " + activity.toAddress;

                    }
                }
                else {
                    if (activity.fromAddress.toLowerCase() == address.toLowerCase()) {
                        title = "Multiple ERC1155 NFTs have moved out of your address " + activity.fromAddress;

                    }
                    else if (activity.toAddress.toLowerCase() == address.toLowerCase()) {
                        title = "Multiple ERC1155 NFTs have moved into your address " + activity.toAddress;

                    }
                }
                content = "The items include: \n";
                for (let item of m) {
                    let tokenId = parseInt(item.tokenId, 16);
                    let number = parseInt(item.value, 16);
                    let assetUrl = "https://opensea.io/assets/ethereum/" + activity.rawContract.address + "/" + tokenId;

                    if (aevent.network == "MATIC_MAINNET") {
                        assetUrl = "https://opensea.io/assets/matic/" + activity.rawContract.address + "/" + tokenId;
                    }
                    if (number > 1) {
                        content += number + "x #" + tokenId + " (ERC1155) " + assetUrl + "\n";
                    }
                    else {
                        content += "#" + tokenId + " (ERC1155) " + assetUrl + "\n";
                    }
                }
                content += "\n\nCheck your wallet to make sure everything is okay!";
                content += "\n\nCheckout the transaction: " + transactionLink;
                sendEmail = true;
            }




            var params = {
                Destination: {
                    ToAddresses: [
                        adr.email,
                    ]
                },
                Message: { 
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data: content.replace("\n", "<br />")
                        },
                        Text: {
                            Charset: "UTF-8",
                            Data: content
                        }
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: title
                    }
                },
                Source: 'info@metaradar.io'
            };

            if (sendEmail) {
                let ses = new AWS.SES({ apiVersion: '2010-12-01' });
                let ret = await ses.sendEmail(params).promise();


                await con.execute(sql, [adr.id, adr.address, adr.email, content, title, json]);
            }
            if (sendError) {

                let content = "Could not process this input: " + json;
                var params = {
                    Destination: {
                        ToAddresses: [
                            "info@metaradar.io",
                        ]
                    },
                    Message: {
                        Body: {
                            Html: {
                                Charset: "UTF-8",
                                Data: content.replace("\n", "<br />")
                            },
                            Text: {
                                Charset: "UTF-8",
                                Data: content
                            }
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: "Unprocessible Input from alchemy"
                        }
                    },
                    Source: 'info@metaradar.io'
                };

                let ses = new AWS.SES({ apiVersion: '2010-12-01' });
                let ret = await ses.sendEmail(params).promise();
            }

        }
        return {
            "success": true
        }
    }
    else {
        return {
            "success": false
        }
    }
}

