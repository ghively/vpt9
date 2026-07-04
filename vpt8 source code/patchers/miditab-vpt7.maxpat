{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 7,
			"minor" : 3,
			"revision" : 4,
			"architecture" : "x86",
			"modernui" : 1
		}
,
		"rect" : [ 322.0, 199.0, 371.0, 457.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 12.0, 12.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"boxes" : [ 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-32",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 841.0, 535.0, 99.0, 22.0 ],
					"style" : "",
					"text" : "scale 0 127 0. 1."
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-54",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 983.0, 173.0, 75.0, 22.0 ],
					"style" : "",
					"text" : "r tmidiselect"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-55",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1019.0, 357.0, 77.0, 22.0 ],
					"style" : "",
					"text" : "s fmidiselect"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-53",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 334.0, 83.0, 78.0, 22.0 ],
					"style" : "",
					"text" : "r tmididevice"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-52",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 347.0, 187.0, 80.0, 22.0 ],
					"style" : "",
					"text" : "s fmididevice"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-48",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 225.0, 53.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-49",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patcher" : 					{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 7,
							"minor" : 3,
							"revision" : 4,
							"architecture" : "x86",
							"modernui" : 1
						}
,
						"rect" : [ 263.0, 44.0, 894.0, 628.0 ],
						"bglocked" : 1,
						"openinpresentation" : 0,
						"default_fontsize" : 12.0,
						"default_fontface" : 0,
						"default_fontname" : "Arial",
						"gridonopen" : 1,
						"gridsize" : [ 12.0, 12.0 ],
						"gridsnaponopen" : 1,
						"objectsnaponopen" : 1,
						"statusbarvisible" : 2,
						"toolbarvisible" : 1,
						"lefttoolbarpinned" : 0,
						"toptoolbarpinned" : 0,
						"righttoolbarpinned" : 0,
						"bottomtoolbarpinned" : 0,
						"toolbars_unpinned_last_save" : 0,
						"tallnewobj" : 0,
						"boxanimatetime" : 200,
						"enablehscroll" : 1,
						"enablevscroll" : 1,
						"devicewidth" : 0.0,
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"boxes" : [ 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-30",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 91.0, 446.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-31",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 209.0, 411.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-22",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 24.0, 447.0, 210.0, 20.0 ],
									"style" : "",
									"text" : "buttons, either button or toggle mode"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-9",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 307.0, 476.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-11",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 296.0, 418.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-5",
									"linecount" : 5,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 256.0, 477.0, 314.0, 75.0 ],
									"style" : "",
									"text" : "offset the ctrl number.  The sliders and buttons have default controller values but you can offset them if you want them to start at a different VPT controller. If you enter a offset of 10 the sliders will start at VPT controller 11, the buttons at 27."
								}

							}
, 							{
								"box" : 								{
									"data" : [ 11229, "", "IBkSG0fBZn....PCIgDQRA...vO..D.VHX....vcQE4J....DLmPIQEBHf.B7g.YHB..f.PRDEDU3wY6cmGeTTe+GG+0rWIYSxliMGDBPBg.Df.xMBHxoJGhJJZ8pRasdTss1Ca6Os1p0ZUas1J0VOpmUQTNpJVDUTATj66aBgDNy88cxtI676OhIFjc2bMSHv744iG9nj8XdOSZduy4NeUV3VxTEgPXHX5b8LfPH55HEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPrzpuBOdvUQ4RCkjKp0WeWvrjPHZuTUUQwpMrFYrXwYbnnn30Wm+K7pdnlSbPTqsVP0idLeJDBMfhhBTuabkeVzP4ESfIkpWec9cS5cUXd3o1ZjxtPbdBETwSc0f6Bx1qOueK7tKIWTTkKDOg37IpppTew440my+GzN2tPUJ7Bw4UT.T838i2le2Gdesi+BgnaNerhZ4zxIDFHs9okqcviGOb7ibDx9DGmFznSgmyXikjGRpDXPAIYIYYnyRKnoqg+XocXNUFGUyVvAnn7xiCtiseVGKAIKIKiVVZAMsvm6oNkVN4ZVEkUFUTZoRVRVF5rzBZZgud2t0xI2Yvsq5jrjrLzYoEjCZmPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHVziI5sb8yCEEEMYZsl0uQxNmb0jokPXzoKE9a8FtVMaZkVFYJEdgPiHaRuPXfnKqgeQK8c0rMoOqrk0tKDZEcov+VK68ziIqPH5jjMoWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.wRWUPCIkAfc61Ya6b25VFNiLBthoMYBIjf4Xm3T7Yqa8npppKYEQ3gyrlwTH7vbvF25NX266.5RNsTv1sy0cUyl23cVttkwEk5fYnCNkl+4BKpX93Oec5RVlMalYMioROiKVNcV4vG+4qCOd7n44LfjShwNxgeVO96sxOlpptZMOuPCIDtxqX5DZngPZomAewF1rlmQGUWxZ3GPxIwCc+2G8sO8R2xHX614u+mdX.3.G5HL0KY7be28sqKYETfAxy7DOBtb6lssy8v8b62FSZ7iSWxpk9w2w2i4NyKSWyX1W1zH4jRjfsamfsamfBLPcKqe48dmj5fF.acG6lwOlQw89C+d5RNVsXs4kmfsamAMf9yrlwTQUU6+vEEEEdpG82RPAEH6bO6ia3ZlKy6JmklmSGktuF94b4SmaXdykbxKOcMmQdQoxINUVr3k+9.vgNR57FO+yvBegWQyWKeu6UOYm6Yer7U7g.PzQEISYhWLqeSaQSyoklxkLdhLhv0soeSRJwD3we5+AG6jmRWyo+I0W5e+Rh67m8qQUUkSd5rzshwANbZbfCmF.XOn.4e8Web9yK74n5ZpUyypGwFCQ4LRd0EsD.vlMabcyc17dq7iz7r5Hz80vWbIkx8d+OHYbrSnq4r9MsU9cO9S07O2ydDKkWQE5xlzejilIK7EdE.vt8f3hG8HIsilglmSShNJmbCyat77u5anaY.P.AD.wDkSF0vGJ+h64N3Fu1qBa1rpKYk5fSgcs28wEk5fYA2z0yEk5f4Udy2VWxpkto4OO1+gRi8dfCoKS+hJtXps15XRierDlCGLwwNZROyioKY0Qn6E9MsscPkUo86mj+DlCG7y9Q+Pd8EuLcMmILtQy+5o9Sz2D5Cad66TWxPQQg6+GeW7hu1hnppqQWxnI8MgdiGOdn15bwZV+FI0AmB+9e0OSWxJzPBlQOhKhYN8ISN4lGy6JmI2ysea5RVMooi6x+4s0u+tvkK279q5S3mbmeedxG9AX3CcH7+9nOU2xq8pK6f10UoW8LNd3eyOmO+K1.qdseotl0F2x1YiaY6LsIMA9SOzugEbO+bM+fNc8W8bHiicb1y9OHQGkSMcZ+sc3ibTtgevOB2tcC.G4nYvRd0WfXiNJxqfB0zrTTTn5Zpgm7YdN.X66du7edtmgW8sVB0VacZZVM4Jl1kx114dnvhJVWl9.LhgkJy4xmN2w88anrxKmK4hGC+we6uhe3O89wiG84.H2dbA0okKkAjL+k+vCxhV56wa+eeecKmXiNJFXx8q4edse0lvYjQPDgGllm0DG2X3xm1jY4+mWjm+oebB1dPr7+yKRXNbn4YEcTNoO8J9l+4pqoVb41MVsp8aVeokUNETPQM+yEWRonp5gfBLHMOqlL9wNZ9xMpeGmE.Ro+IyN18dorxKG.9pMuMBOLGDsS88CqaqtfovGazQwi7a9E7W+muHewF1jtlU+5aB7quueDAXyF.LtQOBJsrxnzxJWyy59dfGl4uf6h4uf6hezu7Aoppqg4uf6p4+fRKMf9kDOvO+d+lkqQMBprxJIqbxUyyZ66ZOLjAM.bFYD.vvG5fofhJlRJsTMOK.BLv.neI1G1yANntL8axoyNGRcPCr4Ojr+I0WZnAOTbokoq41VcAylzeUy5xILGgxe5g9MmwieM2xsSctbooYswstCF0vuHd9m9wovhKgXhxIO1e8ePCMzfllSWsMt0syXFwvZd4JpHif+ze6Y0kC7YV4jKu9hWFOyi+Hjct4QLQGE+0m8Ez7bZRSGD2p04iCx52zVXHozedw+1SPgEWBwFSz7D+8ms4cS5bstrB++5k+O55z+kdiEyK8FKVWynkd1+8qR3g4f.rYiBJpntj8OqfBKhq+6cW51zWUUkm4EdEBIjfI3fBhhKoTbWe85Vdq5SWCqaCahPCNXJtzxz0RQlG+jby2wOQ2l9szK7ZKhEsr2ifCJHJpjRn9569rhfKXVC+4B5wlv2cPkUVEUVYUcIYUc00n6q08bgtxeG1dbAy9vKDhVmT3EBCDovKDFHRgWHLPjBuPXfbd+Qo+Vt94ghhhlLsVy52HY6mKxDIKIqtCY0Ybdeg+VugqUylVokQl98WzRVRVcGxpyP1jdgv.QSWCuhISnpC2hh..Sm4mM0TVKZouqlsoTYkctRVRVcayRKnoE9Hb5jhKn.sbRB.lLalPC6LuauzTVu0xdOIKIKCQVZxzUKmXIm5PIjvz1uhnlsXgAM7Qhsu9avkjkjkQMKsfxB2Rl97a8Q0GbqcnIZEkWFM3Va9RW3HhHvje1zFIKIKiVVsU1G7XOqGSWNJ8g5P6uQPHYIYIY0442OFQwrYPmtutKDBcjO1BA+V3MEpSc4HEJDBcjISXIrn89S4u2msdzaTLaELonaifKBgPCYxDnXAqwDu2eZ+8dULYl.SNUrDZznX979KJOg3BalLiYGNInjS0m80VsEqXxB1hOQrQhZ8rmPH5hI6ftPXfz5amtGO3pnbogRxEUc7FZnPH53TUUQwpMrFYrXwYb97x70+EdUOTyINHp0VKnCizlBgPannn.06FW4mEMTdwDXRo50Wme2jdWElGdpsForKDmmPAU7TWM3tfr85y62Bu6RxEE4zwIDmWQUUk5K16CO69+f141kb92Ehyyn.n5w6GuM+tO7Z02uWgPzEyGqnVNsbBgAhle4y4wiGN9QNBYehiSCZzowyYrwRxCIUBLnybnDVxRxxnkUmkluF9ik1g4TYbTMaAGfhxKON3N19Yc7DjrjrLZY0Yo4E9bO0oz5II.TQYkQEeqwNbIKIKiVVcVZdgudcbH+0sq5jrjrLzY0YIGzNgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.QJ7BgAhT3EBCDovKDFHRgWHLPjBuPXfHEdgv.wRWQHQDd3LmKeZDP.Av120dXO6+f5dlCIkAfc61Ya6b2M+XCaHChKdLijZpoVVwp9DJuhJ0sr.36cyWOu9hWlljg+xZhiaLLjT5O04xMe15VOYkSt5VVieLihgOzgPwkTJe3m94TYkUoaY0jIM9wQIkVJ6+PooKYYxjB2z0cMnnnz7qYMe4FH6bySyyBfD5cuXFSYR3wiGV652.G+jmtSmSaktuF9PB1NO8i86vt8f3HGMC9ge2ahqX5SQWyb.ImDOz8eez29zqlergOzgvO+dtCRK8LwrYS7TO5CgEKl0krLa1L22ce6bsW4r5zS+VKqqatyla7ZuJNb5YPYkWNO8i86oW8LNcIqqYNWA277uF15N1EVsZg+xe32hISJ9YpzwypII1mdwu5mbWzu9lXmNGekU7wEGyclWFAa2dy+mYy5yeajTh8g+3Cd+brieBxJ6b3Ie3Gj35Qrc5rZqz80veoSXbjeAEx+90eK.HiicB9y+geKexmuNcIu4b4SmaXdykbx6L+z4qatyl27cVNewF1DewFfAlbxL1QMB13V1tllUXNbvi9f2OEVTwc3oaaMK.troNIdlW3U3vG4n.Pe5U7boSXbr3k+9ZdV8N934e8xuNGN8LXG6YeL6KapjPu5EG6jmRyyB.qVrvO+dtSx3XmnCO8aKYkThIvANTZ7hu9hzjb7WVK3Fudd8EuTVy52H.X0pUhL7vHGMXqIZKz+0vGRHjSd427OWTIkRTQFAgGlCcIuhKoTt26+AOq+HYf8OINT5Yz7OmdlYx.SteZdVVrXl+yauT9Gu3qzol1skr.3t+EOPykc.5YOhkRKqbcIqm8e+pb3u92gidDCC.xM+Bzkr.36eqeGV2WsINYVY2oxn0xpe8sOzfmF3dt8aiexc9CXvCr+5VVoN3T3HYjIy+pZbKy1wt2KG3vGoSmWaktW3yHyiyXFwEQDgGF.LiIeI.PPAFntj2l11Nnxpp9rd7fsGL0VasM+y0TScDr8fz7rJp3RXm6Y+cpoaaMqus4MmYRDgGNe9WtAcMqm7ge.dfe9Og0t9MQMs32oZYViXXoRe6Se38V4G0ol9skrRJwDvdPAwV19tHiicL9iO3uhgjx.z7rLYxD1CJP9k26cgK2twlMqrvm7QuvZS52wd1GqY8af+8y7WnxpphssycSYkWNtc6Vui9L3td2Xxz274alMaBOd7zkNOnmt0a3ZYpSZB7fO5SRc0Umtl0+2e3IHn.Cjm5O9PL6KaZrpOcMZ5zOjPBl696+c4g9S+EMc55KO7S7znp5AOdTAfdDaLLyoOEMeMuMcPAW56uR1z11APi6B3Lm9T30dqknoY4KcIGk9WcQKg2ZouG.X0lUl9jmDEWZocEQ2rRJsLBOrvnnhKA.hH7vHuN4li1cfISJ7K+w2MQEYDbeOvCqYG0buYbiZDr68c.pykKpo1ZYyaamz+90W3S01bF1PFDNiLbd9m9wA.aVsxjm3ESrQ6j+8+YwZaXecdGLsza9CJKozxIlnhRyyogFZfJqpZxufBa9wxK+BH1XhQyyxWz8MoePCn+7uel+L02PCTmKWb0y5xYSac6M+oocU19t1CSaRS..rGTfL1QMB11N2SW57fd3NtsagHByAOzi8Wz0xN.K3llOS6RmHPiGqhQM7gwwNwI07b13V1NyeA2Uy+2Z+pMwq8VKUWJ6.bmK3VXpWx3AZb4ZRieLrq8p86VF.aY66r4eGZxjBidDWDG3PGVWxxaz80venijNG4nYxK72dhl+CxG4O+206XOKuw67e4O86907zO1umHByAqZ0qoSczk6NHjfsybm4LvrYy7Au8q07iu7U7g7JK5cz7796O2KyC8qtOl5jl.QFQ3bfCeDV4m7YZdNc096O+Kwu8W9SY5S9RH7vbvdOvgY0q8K0krdo2Xw7nOv8yBexGk.CvFomwwXse0lzkr7FkEtkL84pZq9fascOA+hObkd8wiLhvwjIScpSWUpidz3L1dzpY4OwDkSpykKJq7Jz8rZqNeJKqVrPjQDNUWSsTQk9+BW57okKSlTHpHiDWtc2pmkCsX4J5nbR80WOkTZYsqrZOrO3wdVOVWx9vCMdZJ5NH+BK5b8rv40bWe8jWK1GzKT3wiZW5eaTv4n+NTtV5EBCDovKDFHRgWHLPjBuPXfHEdgv.Q2NJ82x0Ouy36WbmwZV+FIa+7c7VxRxxnkUGktU3u0a3Z0roUZYjoeW3krjrLZY0QIaRuPXfn4qgWwjIT83gEsz2Uy17lrx9q+jNSm4mOIYIYYzxpyRyK7Q3zIEWPA7VK68zzoqIylIzvBWxRxxPmUmdZpoSMfjScnDRXgooSSyVrvfF9HwlMaRVRVF5r5rz7u7LMohxKiFbWeG982RNhHhy3lWgjkjkQOq1htzu7Lg5Pa+DOIKIKIqNO4nzKDFH9svqX1Ln10dmoQHDZ.er6.9svaJTmZ9oEPHD5LSlvRXQ68mxeuOa8n2nX1JXRAUYM8BQ2elLAJVvZLw68m1euWESlIvjSEKgFMJl6xt43HDhNBSlwrCmDTxo5y9Zq1hULYAawmH1HQsd1SHDcwjcPWHLPjBuPXfz56XtGO3pnbogRxE050lqhHgPnsTUUQwpMrFYrXwYb97Kwi+K7pdnlSbPTqsVP8BmwgMg3BMJJJP8twU9YQCkWLAlTpd8042Mo2Ug4gmZqQJ6Bw4ITPEO0UCtKv6Cw19sv6tjbQQN+6Bw4UTUUo9hyyqOm+2jd2tPENq8Gn1pqlRJp.poJsYvKTQQA6gDBgDV3DbHg50WijojojYaKSE.UOd+3s42Bu21w+RKpPxOmropJJGW0pMiC4pppDXPAg8PKgX6Y7DVjNkLkLkL6.Y1hWnWe310kOWMUWEEjaNTVwESHg5.mwDWm96rK.d7z.UVd4TZQMNdaYKf.HnfCQxTxTxrcjYaQ6pvWZQERUkWNg3HLM8VuiISlwQ3Q..UUQ4TVIkz7BgjojojYaKy1z6u8DVs0TMtpqNr6i8cnyJDGNvUc0QsU+M6uijojojYaKy1h1UgW0iJpppX1r41UHs4YFSlAUvimu4z.JYJYJY11xrM89zk4FgPzsjT3EBCDc4K4dXgFBW8kMEdi2cknnnvOcA2zY77GH8ixmsgN9cD2VKS.rGTfbqyaNTQEUwoyKeV+V2ollm2xLbGgxrmxDIpHijubKamcenino4M6oNIBNv.vYjgyR+vUSwkVNgEZHbcyZFDhc6rs8te1zN2qtmYSlyzlDGL8L3Xmx6WUWZYlg6HTt94bYTV4URM0UG+uO6Kz8L6QzQwbl1kPc05hikU1rgsuacOyljP7wQ+Sr2ZdOQyWCeTQFF2+cr.rZowOKQUUkE95KlE95Kl+4a7NX0pYxN+B00LA3Vm2bXm6+Pr7O5yXBibXjP78T2y7dusajMuq8w+30WLibnCl9DebZVdSbzCmHCKTV1G8Y7oe0l4GcqeG.X9yZFrwcra9Gu9hYRiYDziniR2yDfYLwwwrl7D0rrZsLuma854i+hMxR+vUSzQFASbzCW2y7ll6L4K1xNXYezmwzm33H5H0ti1t+9ca.1rwsb0yhXb5iywdmflW3m4kNQV7GrJu9bW53FE66vGkCldl5dllTTnfhJA20WOkTdEX1j1LD.4qLCLf..fLOUV.v9S6nLxTGjlkWZYdLd+UuN.33mJaBNnFyKo9DOGNiiC.adW6igOn9q6YNzAlLUVcMr88cPMKqVKyE+AeLm5qG9kx7DmlvBosepn5nYthOcsbzieJpu95ohJpBylztC.muxDZ7Cw+JMdqIZhluI8K58WEI3k0rYypEtzwLRdhm+U05H8Zle9F2J222+lo3RKi5b4p4hndkoK2twdfAPH1sSkUWM8I9dP.V0tQMjBKtrl+2W0kOU1zt1G1CJPpoEWAWUTYUDqyH00LAXeocT.Hk9knlkUqk4wOci61Pjg6fwMhT40V5Jz8Ly7TYQOiMZl8TuD.H2BKR2ybrCOUxJu7I2BKhd0iX0r7ZRW1AsaLWTprmzRGWtcq6YonnvMLmqf+5K8F7X+yWlrxs.lx3FstloGOd3sVwp3WeWeOdnexcfESlo9Fz96e.W2rlN1CH.V4m+EzPCdfVd4OqnPC5v2rwVlYWEukYjgEJ24Mdc7dqdsjewkzkjY14U.u767dTTokxzmvXz0LiNxv4xl333z4lG8J1XvQnASLQFgllWWVg+hRY.r88dftjrBvlMTPkryq..XOGJMhKFsaea8kpqoV98+8miG6YeIxqnhIuBKVyl1JJJbG2z0RYkWIu0JVEppPctbgkVbyJLrPBghJoL+LU57Yp27UlwGaL7i9t2Hu5ReeNRlmP2yzrISL0w+ME7CdzLwYDZW4yaYZ0pM10ARiAjXBDeOhkvBMDh144oE936QLjUtd+qrmVq15piBKoTlyzlDImXu4xmzDXq6c+5dtybxSfKYzCmgNfjYBibXrs8nce.2bl5jnGQGE1rZkYOkKgYdoiG.NvQNJW0LlB8uu8goL9wvN1+gz8L0SdKSylMwO86eSbxrxgQOrgvrmxkv.SJAcMyF73ggz+9wrl7DY.Ik.S8hGMacOZ2eC4sLyNu7YUq6qXUq6qXK6YebpryiCnwGuKc4zxkaAEwGtl0eFO1Kuj2UWWCw2NyWaYe.oNv9Q+5SuXIe3pI67xW2y7Md2UxjFyHvQHgvysnkRU0Tilk0tNvg4vYdrl+4lFm.V1p9TF4PRg9mPe3e+1+Wprpp08LaxGutMPIUTglkmuxzrIy7Ruy6dFutRKq7u8aUSyDfWbwKmoMgwPx8o2rx0r9lONB5YlM4jYkqltL1DcovWmKWm0A3PqOWssVl04xE6XeZ2Z6ZKYVcM0xm7kaRWxJK+7AV67.GtKOSPaOHVsVlG83mRyyp0xzc80eN4++DZbqTqsNs4qTaKIWocBgAhT3EBCj1Uguo6.Np5zM0xllts7NsijojojYaKy1h1UgOf.CDq1rQMUqcGXnVplppBqAXCaA7MW0QRlRlRlssLaKZWE9PBKbBNzPozhJfpqrBMcDksw6dGESvgFJNh3atZwjLkLkLaaY1VztNJ8NBOBp6qOUSUVQYTRgEztByerFfMbDd3DgynOiaIPRlRlRlssLaKZ2mVtniqmDPPAQEkVJ0Uq1cdlsEP.DVjN85BfjojojYaKyVixB2Rl9baMp9fZ62EWgPz0w9fG6Y8XcnK7FixMzeISIyyGyzeZ2EdixMzeISIyyGyr0HCDERlRlWfjYagLPTHYJYdARlso2e6ILixMzeISIyyGyrsPFHJjLkLu.Iy1z6SWlaDBQ2RRgWHLPz7a.Fd6lqeehONl2kM0leMqbseIYbhSqqYZ1rIlyTuTrGX.TumFX4q5yzr77VlkTVE59.tg2VN06AbCeMnPnmC3FW6LmNVLalPC1Nu0JVE0VmKce.2vaY1D8Z.2vaYp2C3FZ5Z380MW+j5c7rs8cflGPJzxxtux7ZuhoyIyJGdmU9IDY3gwHFRJ5Zl58.tguVN0yAbCekodNfaLxgjBQFtCV5GtZNYV4vbm9jAz2AbCekIneC3F9JS8b.2.z30vmVlGi8bvF+z9Vdy0uW8HVNvQNJydJWBaeuGPSuEC6sLUTfTRtu79qdsjbh8lW5s+uZ58SOesb1D8X.2vWYpmC3FdKSeMfabxrxQSx7j4jCoe7SB.EWdED0WeaZNo9DOuxReefuY.23iKPa9.UekodNfa3qL0yAbCPiWCegEWFU90e+ea4MW+d0iXHk90WxofB4dtsajXzva8tdKyfsaGaVrxscsWICHwD3WcmKfHC2gtlYSZZ.2Xsad6ZVd9KylFvMdne7OjvBIXMc.2vaY1xAbC.5S78ffCLPMMyJppZlwDGG25UOa9pcrauNfaDZvAqqYBMNfar4cos65Pqk42d.2Pqu0tqK2DKutYMcBzV.r3O4yAfm7EdsleNSlLwzF+X4cV4mnaYFZHgf8fBn48KphpqlIMlQwJ9z0paY1D8d.2nkY1xAbiryq.t4qZVLkwMZV2Vz1OrokYppRyC3Ftp2MG8XmTWFvM9rMrEN5INE290eMMNZE0ELfazxLejE9BZ9zuslYSC3Fu6pWilOfanoqg2q2P+Ma5LFwNb6xMlzvM6zaYVQkUQs04BWta7ODqrxpvhEsaQ0eCPC50.tg2xTuGvM70xodNfaLzAlL8HpFu9vO9oyl.CvF0We855.tg2xzrFbYv1QxTOGvM.Mtv60an+M3gQLjTXVSdhjbh8loL9wvWtscoqYpppxl14d4lm6LI4D6MSc7iks1ELnP.52.tg2xTuGvM70xodNfanfBKX9ykjSr2LqIOQNzQOFM3witNfa3qL0SdKSTPWGvM.MdS584Mz+29cYBibXz+D5MuyG7QZ5lo3qLW4Z9RF1.6OCHwDXwevGQtZzA3weYB52.tguxTOGvM7Ul54.twdSKc73wCCHwDvsa2rnU7g.56.tguxrI5w.tg2xTuGvM.Mtv6qat9UTYUmStg9u2zRm8lV5coYpWC3F9JS8b.2vWYpmC3F.r+zyf8mdFm0iqWC3F9KSPeFvM7VlMzfGcc.2.jqzNgvPQJ7BgwbpNoV..vBHlDQAQEhLPTHYJYdARlsEx.Qgjoj4EHY1VHCDERlRlWfjYagLPTHYJYdARlsEx.Qgjoj4EPY1ZjAhBg3BTdafnPNsbBgAhT3EBCD+V3ULaFc4BCWHD5Ke7s8yuEdSg5zmuQgPzMkISXIrn89S4u2msdzaTLaELonomGQgPnSLYBTrf0Xh26Os+duJlLSfImJVBMZTLqK2bbDBgVwjYL6vIAkbp9ru1psXESVvV7IhMRTqm8DBQWLYGzEBCDovKDFHRgWHLPZ8iDmGO3pnbogRxE0509aGwBgnySUUEEq1vZjwhEmw4yum79uvq5gZNwAQs1ZAc5KxuPH57TTTf5ciq7yhFJuXBLoT85qyuaRuqByCO0ViT1EhySnfJdpqFbWf2uYp52Bu6RxEE4BtQHNuhppJ0Wr2GaD7+AsysK4JrSHNOiBfpGue71769v2duA4IDhtI7wJpkSKmPXfzou.4qs5pojhJfZppJsX9oSQQQA6gDRi2.ACIzy0yNBQ2NcpBeoEUH4mS1TUEkiqVL9cethppJAFTPXOzRH1dFOgEoyy0yRBQ2Jc3BeMUWEEjaNTVwESHg5.mwDGlNG+cm2imFnxxKmRKpwwBLaAD.AEbHmSmmDhtS5vE9RKpPpp7xIDGg0gt6YpGLYxLNBOBflt2cWhT3EhVnCuJ4ZqoZbUWcXua39JGhCG3pt5n1pO2ebEDhtS5vEdUOpnpphYyl0x4GMgISlAUviG4JDTHZI41XinUUY4kg8PB8rNFMEWP9russYl7ruptj4iirucyV+h0PuSpeDWuSn4+8jm8U2tmV9ZY5BcFqk1KP4HX6Xyp97Y2d73gm9A9EzPCm8UtU4kVB6dSektjq27tu9KQhCHER4hF4Y7uau72xzE5zk+JomwFMoNf9wpW+laSu9gOnAxtOTZXypE5WB8lCczioGyVWP56b4Sl9ziXviGU9ue9543438qg51pSerLn7RKgd029givifrOwwn1pqhiejCSOSnuTdIEiYyVnhxJAy939lVc0TCEWP9DVjN43G4v3HhHnW8seeyyUX9MOMRJkgbFWQmpppbxidDpphJnG8tODYzw..mLizo5JqfHbFEkVbwM+uCIrvo5JqjLO7AvV.ARRCZHXwx2Lec7zSipqnBhqOIPDQ03cx0VtL02AN3y30egNcYIMn.CfdDcTs4W+7thowtOTZ3LhH3RG6HkBeaz.SnWjXbwxyu7UxjFQpLswNbd0U7IcnokGOdXQ+ymlpqrR5S+5Oq3MdEt1u+cwoOVF.vt135QASrh27kQUEBztcl00eydcZUPtYyRdwmk.BxN8teIyA2w1X7yXlLk4b0jW1mlk8R+qlmF20C7HX0lM.nd2tYQO6SiKW0Qb8NA9f2503JttajQLgIw911lwSCMvd25lvjYKM+uQQg+2a85LzwbwTckUvJVzqxO8QdRrEXf71uv+fxKoXhOg9xJem2fYeC2BoN5wQZ6c2MuL069l74ME9ppnbxKqSiyX6Ag0NG0Xahtsj5L7v4m+CtUrGT.rp0sA10ANL20Mec7+97ujryq.F6vSknhHBps1ZwQnAyMM2YRfAD.8sWwyTF2nYWG7vbcyZF3LbG31cC7xK48nxpqlG5mbGTRokSXNBgSd5bXQqXU50hP2d8vYjTYM0R4UUMmNuBYnI2WLonfmNvW3oz16tnzBKje7i7DXxjIRZPCgSlQ5L8q953yd+kw79d2A4bxSPIEUHO3e+EvdHgvwSOMeN8Js3h3+6u8GI3PBkANrQvmr72loLmF2W6VNMZocsouhpqpRt6e6ihISlXLSdZ7b+wGhAOhQybtwuKacceFW4Mu.BMrv4f6bqbk27BXeaayz6jRlY+ctUTTTXqq6yolpqhir+8Pw4mG2yu6wvjISLtodY7hO9CyfF9nXpycdMuLY0ps18uqNWXs+u2iU+tKo4edLW5zXdeu6nc+8cQ2J7AGbP7zuzahEKl49992LG5nY50W2Z1z1Xxiaz71+uOl3hIZrYyBqaKam63FuV1WZoyl209H092OVv0MW9Wu4RH5HBmm6MWBEWZ47K+g2F8HJmjagEoWKFcqY0hYpu9F.f58z3+qEKlwk61+9ll0wOFINfTZ9fXkxvFAoLrQbVmoiHhJ5ypn5MgEgylu7lCITGzPKlm70zH2ScB5epCq44gdzq9PvgFFElWNDehI40bF7HFMe0pWEO0u9mx.F5EwfGwnIbmQwVV6mQUUTAu0+7u07qs1ZZ7x.OxnisUm+6NIs8taV86tDRczii4e6+H17ZVMe7xVLQGWOYRy7JaWSKcqvm1QOF0Tas.P14V.wESaeS7AnmwDMu1xVA.r+zyfa5pmE.TdkUSwkVN.TRYkS.Ab9wmPqGb2PCX1bikCKe8oGsoO.n8xjIE734adutc6hJJoDBOpn+Vut11w48a+5TQ0mOWKe7FZ3Lm+ang5QwOYFtyn39exmgiejCyQO39XIu3+jq7lW.JlTnO8KYl7b9lif+zul4ed4kasEqVY5W87Yxy4pvpUabwS8x3SV9aSQ429OdM51Qo2ZKNpwAEX.3xU8e8+WdiaBhkV4726tg5wt8fZbZYwBpe8ccG46m+2H+hKkPsGDNB1NwGcTjeIk1g1bd.Rn+ovQ1+dwUcM9gz6Ziqm2+MeETTTPQQ4LVCsdIwAjBGZWam595UTjwgN.dZnAhINuOJp.vWrpOfUsjEQRoLXt7q86vfFwnnjBymD6eJbxLNJQFULzy9jHJnvhd1mFftzkIsP+FzPXFWy7wpUaTY4kya9r+UTUUYniYbs6oktsF9Ql5fXWGLMB1dPDVnAS14mO4WXwLkwMR1eZYvEO7gwgy73.M9I6SZLifCczLI1nihT6e+XG68fb0yXJrocsGF9fGHabm6SulUOu0gO9oX3CHItmqet3t9F3+94quCOs52fFBoNpwxy9v+eDZ3QPEkUJe2e58ihhB8pu8im52beb0e2efFN2e1FxnFKYbnCvB+c+JB2YzTRgEvMbG2KVrZ0mumQNwKkW4odL9WO5us4sP3Jl+MQngENCcLiiE96+MDQTQSA4jEy4F+tMuO6MsLc2O3efniqm55xkVQUUkW8oebJL2b3tev+.Iz+A1tmFJKbKY5yUIT8A2pOeiYd3CRA4388sJv.rgiPBl9kPuwjISrkcsOp+q2TswM7TIn.Bj8md53wiJEWZ4DqyHInfBjie5rIg36I0UWcjagEwfRtuz2dEOmLqbX+o23QKNwd0SN9oa790UOhxIkTdETmKWm07PVGOShNt3HoTFb662HmGxQv1oVWt5P6692VUUVAtpsVBKRmMuo2d73g5psFBHvf5RtPUZZdHzvB2uk8l3wiGJujhQUUkvcF0YbfrpopJo1ZpA6gDJADXfmw6oqbYRKbxLRmm+w9cby2yOigNlKtUe81G7XOqGSWJ7cGXjJ7BigRJr.1wW8ELrwMd+taNMwaE9yO9nMgPPwEjOe9JVNmH8izgmFRgWHNOQjQGCS+pmOwmPhc3oQG9f10z9Iop5AEktWetQSGQe4lvo3BIQDUzLiqY9cpoQGtoFPfAhUa1nlpqtSMCnGpoppvZ.1vV.AbtdVQH5VoCW3CIrvI3PCkRKp.ptxJ51b9wa7NcSwDbnghiN30arPbgpN7lz6H7HntZpA.prhxnjBKPylo5LrFfMbDd3Dgyn61bq2RH5tnScg2Dcb8j.BJHpnzRotZqQqlm5TrEP.DVjNkxtP3Ec5qzNGgGQy23HEBQ2acuN75BgPW42BuhYy9bLpRHDci4quQh988DpSe9FEBQ2TlLgkvh16Ok+de15QuQwrUvjR2lS6lPH7CSl.EKXMFues16+Mo2jYBL4TwRnQihOtgEJDhtILYFyNbRPImpO6qsZKVwjErEehXiD05YOgPzES1Acgv.QJ7BgAhT3EBCDovKDFHRgWHLP9+AXnu3YTV5o8h.....jTQNQjqBAlf" ],
									"embed" : 1,
									"id" : "obj-4",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 198.0, 102.0, 252.0, 344.0 ]
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-21",
									"linecount" : 5,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 455.0, 112.0, 387.0, 75.0 ],
									"style" : "",
									"text" : "The soft controllers can be useful if you don´t have access to a midicontroller, or just to test a VPT controller. They are also useful as a way of creating submasters. You can easily set up for instance slider 1 to control the fader level of layer1,2,5 at once, by using VPT controller 1 for the fade control of the respective layers."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial Bold",
									"fontsize" : 14.0,
									"id" : "obj-58",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 390.0, 7.0, 112.0, 23.0 ],
									"style" : "",
									"text" : "soft controllers"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-2",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 793.0, 2.0, 27.0, 20.0 ],
									"style" : "",
									"text" : "r lb"
								}

							}
, 							{
								"box" : 								{
									"handoff" : "",
									"id" : "obj-16",
									"maxclass" : "ubutton",
									"numinlets" : 1,
									"numoutlets" : 4,
									"outlettype" : [ "bang", "bang", "", "int" ],
									"patching_rect" : [ 839.0, 13.0, 25.0, 29.0 ],
									"presentation" : 1,
									"presentation_rect" : [ 839.0, 13.0, 25.0, 29.0 ]
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-15",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 797.0, 21.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-13",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"patching_rect" : [ 802.0, 43.0, 24.0, 20.0 ],
									"style" : "",
									"text" : "t 1"
								}

							}
, 							{
								"box" : 								{
									"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
									"checkedcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
									"id" : "obj-12",
									"ignoreclick" : 1,
									"maxclass" : "toggle",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "int" ],
									"parameter_enable" : 0,
									"patching_rect" : [ 838.0, 12.0, 26.0, 26.0 ],
									"presentation" : 1,
									"presentation_rect" : [ 838.0, 12.0, 26.0, 26.0 ],
									"style" : "",
									"uncheckedcolor" : [ 0.0, 0.0, 0.0, 0.0 ]
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-10",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 747.0, 40.0, 47.0, 18.0 ],
									"style" : "",
									"text" : "wclose"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-7",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 557.0, 30.0, 148.0, 18.0 ],
									"style" : "",
									"text" : "window title, window exec"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-6",
									"maxclass" : "message",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 547.0, 7.0, 243.0, 18.0 ],
									"style" : "",
									"text" : "window notitle, window exec, savewindow 1"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"hidden" : 1,
									"id" : "obj-1",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 2,
									"outlettype" : [ "", "" ],
									"patching_rect" : [ 531.0, 53.0, 69.0, 20.0 ],
									"save" : [ "#N", "thispatcher", ";", "#Q", "savewindow", 1, ";", "#Q", "end", ";" ],
									"style" : "",
									"text" : "thispatcher"
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"hidden" : 1,
									"id" : "obj-3",
									"index" : 1,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 25.0, 20.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"angle" : 0.0,
									"background" : 1,
									"bgcolor" : [ 0.827451, 0.827451, 0.827451, 1.0 ],
									"id" : "obj-20",
									"maxclass" : "panel",
									"mode" : 0,
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 1.0, 1.0, 890.0, 623.0 ],
									"proportion" : 0.39,
									"style" : ""
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"hidden" : 1,
									"source" : [ "obj-10", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-9", 0 ],
									"source" : [ "obj-11", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-12", 0 ],
									"hidden" : 1,
									"source" : [ "obj-13", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"hidden" : 1,
									"source" : [ "obj-15", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-10", 0 ],
									"hidden" : 1,
									"source" : [ "obj-16", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-13", 0 ],
									"hidden" : 1,
									"source" : [ "obj-2", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-30", 0 ],
									"source" : [ "obj-31", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"hidden" : 1,
									"source" : [ "obj-6", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-1", 0 ],
									"hidden" : 1,
									"source" : [ "obj-7", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 225.0, 96.0, 65.0, 20.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p softcontrol"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-50",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 225.0, 74.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-51",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 225.0, 26.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 244.0, 379.0, 21.0, 17.0 ],
					"style" : "",
					"text" : "?",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"tosymbol" : 0,
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-92",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 165.0, 54.0, 33.0, 20.0 ],
					"style" : "",
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-95",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patcher" : 					{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 7,
							"minor" : 3,
							"revision" : 4,
							"architecture" : "x86",
							"modernui" : 1
						}
,
						"rect" : [ 263.0, 44.0, 873.0, 317.0 ],
						"bglocked" : 1,
						"openinpresentation" : 0,
						"default_fontsize" : 12.0,
						"default_fontface" : 0,
						"default_fontname" : "Arial",
						"gridonopen" : 1,
						"gridsize" : [ 12.0, 12.0 ],
						"gridsnaponopen" : 1,
						"objectsnaponopen" : 1,
						"statusbarvisible" : 2,
						"toolbarvisible" : 1,
						"lefttoolbarpinned" : 0,
						"toptoolbarpinned" : 0,
						"righttoolbarpinned" : 0,
						"bottomtoolbarpinned" : 0,
						"toolbars_unpinned_last_save" : 0,
						"tallnewobj" : 0,
						"boxanimatetime" : 200,
						"enablehscroll" : 1,
						"enablevscroll" : 1,
						"devicewidth" : 0.0,
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"boxes" : [ 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-9",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 517.0, 224.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-11",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 423.0, 174.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-8",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 78.0, 232.0, 150.0, 20.0 ],
									"style" : "",
									"text" : "refresh list of midi devices"
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-34",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 148.0, 231.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-35",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 207.0, 174.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-30",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 402.0, 99.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-31",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 375.0, 144.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-26",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 203.0, 146.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-27",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 97.0, 102.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-25",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 367.0, 193.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"hidden" : 1,
									"id" : "obj-24",
									"maxclass" : "button",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "bang" ],
									"patching_rect" : [ 346.0, 243.0, 20.0, 20.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-22",
									"linecount" : 2,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 413.0, 83.0, 210.0, 34.0 ],
									"style" : "",
									"text" : "choose behaviour for note on/off, either button or toggle mode"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-21",
									"linecount" : 5,
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 516.0, 224.0, 318.0, 75.0 ],
									"style" : "",
									"text" : "offset the ctrl number. Useful for instance if your instance your midi device sends out data from cc 32 but you would want it to start at VPT controller 1 . You would then adjust the offset to -31. If you want cc 1 to start at VPT controller 10 you would adjust the ofset to 9."
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-17",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 342.0, 257.0, 150.0, 20.0 ],
									"style" : "",
									"text" : "select mididevice"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial",
									"fontsize" : 12.0,
									"id" : "obj-14",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 40.0, 85.0, 150.0, 20.0 ],
									"style" : "",
									"text" : "incoming midi data"
								}

							}
, 							{
								"box" : 								{
									"fontname" : "Arial Bold",
									"fontsize" : 14.0,
									"id" : "obj-58",
									"maxclass" : "comment",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 390.0, 7.0, 112.0, 23.0 ],
									"style" : "",
									"text" : "midi"
								}

							}
, 							{
								"box" : 								{
									"comment" : "",
									"hidden" : 1,
									"id" : "obj-3",
									"index" : 1,
									"maxclass" : "inlet",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 25.0, 20.0, 25.0, 25.0 ],
									"style" : ""
								}

							}
, 							{
								"box" : 								{
									"data" : [ 9953, "", "IBkSG0fBZn....PCIgDQRA..AjC...fUHX.....szDtx....DLmPIQEBHf.B7g.YHB..f.PRDEDU3wY6cdGdTUl9+9d5yjYRuGBPHPBgPKRU5JEoYAUrsxZYwBt100dY0uq5Z4mq5t1w1JpnKHHhTDktzagPDBjP58IkYlL85u+XfwLlDXRiDhm6qqbcMy48bddedOYlm4sc97H5s1S9dP.ADPfdnHtq1ADP.ADnyDgfbBHf.8nQHHm.BHPOZDBxIf.Bzilt8A410p9FJImra1x19x+BpH+SftpqfM7Yu6YzN0WU47Se160Y3hAL0VdIrwk7Aco9f.B7GMZUA4ra0JkmWNcV9RyWmVLiKmNZ1xN7lWO0TZw31karZx3YzNFpsF16Z+1NCWLfQu1pX+q+65R8AAD3OZzpBxs528U4eemWWGREa0jQJK2igQc0Q1+xlnphxG.prfbI6suQL2fA.H0QOdhLgd665zUcEj812H5ptBeGScngwvunY5m8K9XYwQ11Oi9Zp1uiaTWcbjs9ST5w+U+NtgZ0xg940PlaZcXRuN+7QS50wQ15OQQGMql3+MWYMtdxYO+Btc4psdaR.ADnchjYe62+yc1NIi5pi+6Seebfeb0HUlLl9MeWs6Jtr7xgO8IuG90eYSXyrQVwa7OPaIE5M.zINJqewuIS3ptQ9lW9oPgJUjv.Rir1xOxm732MRjJkssrkf1RJfAOwohKGN3ye1GfIes2Ltc6lO5QuSxZKa.OtcwJd8mmXSZ.HWoJ14JWJ4r6shS613G+j+CNsYijyXzru08c7E+8GBoxjQAG4f78u8qvnm8URMkUB+2m99HyMtVb4vNq+idKb4vAImwnor7xoEKqfibPdm6dAHRrXxOy8v1V9RXDy3xvPsUyQ2wlYhW8BZ22+DPfdpXTWcTzudXjHUJJUqocaOoAxIYnlpIjnhkYtv6gs7Ueb6tROM50VIO7mtRTGZ3HVpLzVRgrn23S.fmedShJy+D9c9q5seEVvy85jxHuPrY1Duv0LslXyitiMS8UTF+sOe0HVrXRcjiiByNSF7DmJNrYg67M9DTGZ3LjIOcV0+9kX527cQkEbBt0W5so2CZn.vad6WCEl8gHzniCcUWAO+p+VTGZ3j93uHV869Z9Bx2Rk80uzSx7ejmigMkKA.9rm5d4WV9RHogdAcX26DPfdhrgO8cXMu+q668i6JtNttm3kPjHQsYaFPA4RX.ow083u.a8q+z1bE0bDVrIf5PCG.ToNXhqeCvWYJBRCNazbwYwnApszhH4gOpSUtZRZHMMnQI4jMImwnQrXuiDO8Ibwj9DtXJ5nYQXwDuu5SSXQfca1.fK4VtaNvFVM6csq.skTHkm2w8MDyPa70DQj3zgce0UyUlSG1opBxkcrhuh89CdmCPskVDhkHQHHm.BbF3n6bKrl2+0IioNa9SOyqxu7seAe+a+JDSe6OS8Fus1rcCnfbcVb5.QmFQzxQqEKwqq5xoCjH06q83ooOQZhEK1u4.ygManulp7Z+eW8wot924d9yDUh8gQMyqfob82Je8K9DsnORipylqrS+KNS+lVDpBNDeEoRSHnWaksX6S.A9iNxjqfYca2OS+lVDxTnfIbU2Hq9cdUpsrhZW1sa+VH4znPUPjzPGAG7m9A.vX80RAYcflbdIO7QQN6daXyhY.XeqakrrW4YZQ6Z2pEJ9nGlK6teTReBWLJTEDkk6QwsSmsI+ThTYz2AmAkk6QIwTSmDSMc13R9PNx11PaxdBHveTHkQMNl8se+HSgBLVes7QO5hviGOL7oN61kc6R6IWqkq4Q++3idj6f89CKGqlMQnQGaSNmTF03X3W7r309yWJgDULzPsZ41dsODqlM0r1TtRULl4d07t26MQL8MYrYxDINvAScUVFQlXeaS94M7zuBK9uc6j4FWGVMYD0gFFiYtyuIywn.BHPSwiGO7t22Mi1hKfGXwKi9MrQ1trmny2TgDm1sg9Zzhlvi.EpBpEOOS5qGalMSXwFeSGVYyfdsUga2tH7XSnCwOc61M5ppBDKQLgES7cH1T.A9i.Elcl7FK7p3Vdo2lKXZyocauyq5IG.RkqfHSHwy54oNzv8sn.ABMWuBaOHVrXhH9d0gZSAD3OBDbDQwrts6mD5+.6Pr24MyIm.BHveLntxKg0+QuE42Ly4daAgfbBHf.cqHhD5My51te58.GbGh8NuaN4DP.ADn0fPO4DP.A5QiPPNADPfdzHDjS.ADnGMBA45gyu7seAkk64VM.T.A5NgPPtNQ73wC0WU4X1fd+NtUSMPcUTFtc6tS2GxZK+H0TZgc50i.BzcktbkAtkD2xV53mufgZ0xKeCyhm6xmHO0rFkO4YeyK8S3IlwH34m2j3Eu1o6m3ed1njicDLoudeu2bCFn3i4UrNc61M4e38ydW6JnvryrIWqUSM36bAup5RieO.4e38yQ15OQskWZqpsJf.cmoKSYfc61MK9QtCVwa7BbxL2Ku9sbEbzctkV73muwt9tuFyFzw+7myjK8t9artO7MwlYirl260Xt24CwKuwLwtYSriUtz.1l6csqfM2H876WV9RXOqdYXyhYd8a4JXKK8io3ilEe5SdO9oIW.TddGmk9BOleu+zpshGOd3ydp6ku+cdUNwA1Euyceij4lVe67Nf.Bz8f.5w5xnt5XouviwQ24VQgJUcHUbKItktc4pYOd5i+h5Pp2yULyEdubQ+oEhBUAgKWtPgJUHSgJd4MdXDIRLNsaCmNbfJ0AGv1brW574ier6h4tnGFQhDw9W+2wM9r++PawEv.GyD4xuGuAwFxjlNe++4exbWzCGP18z4JiG5SVAhkHgIbk+Idq63ZYnSdZHQpr1T6W.A5tPWlx.2Rha45V7a0rG+7QTnJH90crI9wO9eykc2OJhkHAwRjfcqV4ierEgR0pYbyKv6YbhCbvnRSvTPVG.oxkiHQhouCd3.fKWtXMu+qitpqjhOZVPqPIUKMmrwj953Sd7+puiY0TCTW4kRz8oeAdCV.A5FRWlx.2RhaYKc7n5Ue5vp6yUbnMtVVxe+g3htg+BWz0+W..aVLy6e+2B0UY4b2u8RPklPNKVweF6kNeNvOtJDKUFi4RuZ.u8J9q+mOIy7ubOLnwMEF4LubV4a9h9cchDIpw58oe5kmHwhouC4BX52zh7crYc62Og0AoHKBHPWIcYqtZKItksVQur6JkmWN7kO+CS+yXTLnKbxj6A1Mtc4hu9kdRJL6LYN2wCfdsUQMk15T8zQNqqfr+kMSVaYCL5Yek.PtGbOLnKbxLgq5FI4gOJx6f6A2t7WzOUpVC50VE1sZE.N1t2luxRNiQSQYeHhLgDIwTSGQhDwG+nKBADnm.cYRsTKItkwlT+a1ie9Fa5KVLNrYiSrucxI12NAfGYI+.G5mVMd73gu5e7n.vEc82JW4CF3Aw0DVDz2zGJNsamPhLZ.XjWxkw6+.2JevCtPbXyJwz2jogZ05W9pMtjSk9MrQv+75mAAEZ3jv.RyWYC5BmLYL04vqtf4RDwmHUU3IYd2+SgLEJ5HtUHf.cozpd.825W+ortE+l7xa7vcXNPKItksVQu7O5X2pEZntZQcnghxyvhYnq5JPrDYDRjQ0jxLaPOVL1.ZBKbTDj5NS2U.ANmgfJjHf.BziFgtHIf.BziFgfbBHf.8nQHHm.BHPOZDBxIf.Bzily6xVWBzyFKFMPcUTNlMnqq1UPjXwnNzvHjHitUk42Dn6EBA4DnaC0WYYTUgEfQc0fUSlwuGQitHTpQC5CqZhK49Kj+bOOEgfbBzs.yMXfpKt.pupxQSngSjIzGDKVRWpO41kKZn9ZotJ7J8TxUFDAERnco9j.sd51Omb6ZUeCkjS1MaYae4eAUj+IPW0U3Su1ZqzPc0bNQDKOWS6QYf+82W6L01u5qrbZntZQSXQPHQESWd.N.DKQBgFULnI7HwntZPu1J6pcIAZCDvA4ra0Blav.lav.VLZnyzm7udsX1uGOoFyokHH2tbiUSFay0ga2t4Eu1oiKGMe8zdn9JKCqlZnC2tAJsGkAtw2W27W8wr0u4y53breGVM0.1Mapa4beEb3QhMylwRCm69bu.cbDvCW8s+q2HE8qdUbVkpClWYSsuGsKqlLRskWBgFcrTX1YRz8NIhsuISkEjK0TZwjbFilfBNDRcziGMgGouqSW0UPoG+nj3.S22wTGZXL7KZl9Y2vhIdxOy8QHQGK8M8g46bMpqNJHqChLEJI0QMNDKQBkd7rwRCF3jYtOFvHFCRkI264c3CfLkp7cdsFb61MevCbqj6A2CRjHga609PF3XlP65dVIG6HDQBI5KPf4FLPMkVH8YPdae4e38iIc0SBoLHhLgDax06wiGJ7HGDi0WGIjRZDYB81uxK9XYgdsUSeReXDZTw369pI85nrSbTb61EUWbAX2hYBIpX88ngYyrIpH+bIogjQats41kKb61CRj1zORpTtTBQkRpVea+GxZOHVhD731CtZj53Hv4ODP8jysa2TwIONW1c+nbOu6Wwc9u9n1cEWUQ4yG+X2EezibmbrctYdiEdUrzW7w46e6Wgc88eCu5BlCNrYiU+tuFmXe6.vauRdiENexYOamO6oueppv7.fpKJeVxe+A8Y2O8Itadu66l4368W3iez6je9+9d.dkjnWcAykisqsx19eeFu4seMX0TC9Td38utUhCaVofibPd0EbobzcsU14J+R9220M3S8NBTxZKafSr+cxSurMRFSet7cu0Kd1unyBsjx.GHJ6qS613CdnE589492I+6675Yeq66.ZYUZ9z2W0qsRJOubnhSdbJ7HGjC9yqge7ieqeyuVyJXGq3Ka2suVhDhHTl9vGX.e92ybmD.DYvAwML4Q1Y4VBbdBATO4zVbAX2pENw91Am7P6iYtv6oCox0qsRd3OcknNzvQrTYnsjBYQuwm..O+7lDUl+I767W0a+Jrfm60IkQdgXyrIdgqYZMqc0UcE77q9aQcngS5i+hX0u6qwztoEw27JOCW6i+hLjINU.3Seh6le9y+.lyc7frtO7M45dhWBYJTvW+ROIy+QdNF1TtD.3ydp6keY4KgotfaOfaaklyQHjHigHhuWj7vFI6aMeKtb5ncoztsjx.elT12Sy9V+pvr954AV7xQrDILtq353e8WtJF5jmN4cv8zrpw7Pmj2qOgAjFCdRSCWNcxXl6USUEkOu0cbsbUOzyhDoxXeqaEbY+0GsM2tBTF4.5MJkIkCjWIX0gStfjSj7pPKMXwFwGQnDjBonPhLhK7P3BSKIBQkR5czgyfRLVNVoUQrgELYzudwIqpFxq7Z.fKbfIQMMXj9GaTbvSVJZMz0zaQA57Hfk+79MrQRFScNj6A1Mu+Cbq7rqbaDTvsNAe72SXwlfugdoRcvDW+FfuxTDjFb1n4hyhQCTaoEQxCeTmpb0jzPtfl0tgFS79rqlHhDmNrikFLf9pqfzG2T7cdoOgKlCu4eWOdbXmpJHW1wJ9J16O7s.f1RKpUObU6VshzSIUQRkIGOd7fCaVaWA4ZIkA9HacCsnx9dZJOubHswNYesiDFPZDbDQh1hKnEUo4RN1QZV+H19lLQ26j3X6ZaDce5GMTWMLfQdgs41Ufvf6a7TY8FPlLobySar7AqeGbA8OQpTWCzfEazqHCgHCVCGLuRvgSWTpVcDYHpwhMGTiASbgokDiK09x5OXNLyLFDgotH1etEykMlgvAyqDxsBs7WmyD4UW4lvhM6cpsEAN2R.Ejq+YLZdfEuL.neCejbveZ0T4IONImwnaWU9uWBkDQKKY2hk30U81aHuu1SKrOpZhzL4wChkH9TWuSeeQ2kCGMYU7DcJYCe52zhPUiBh2ZUvWYJUfS6d+xhC61PjHQHSgxVkMZNZNkANPT1WwhEiKW9uvJNc3.QRjzhpw7Y2O9dhp28kQM6qz28sNKNZwUvlNRt.vcNywSbg07xIkVCFwoK2TZs5vka2XxlMzZvH+4oNZ9nMraLX1B4UYM7nW4zX+4VLtb4lUr6CiGOvEz+DIxfChREBx0ih.ZN41ypWFuv7mJlzqiRO9QQrDoDd78py127CEpBhjF5H3f+zO..FquVJHqCDvWuR0AS78efr+ebU.dC1cnMtF5+ELFDIVLhDIBmNrgDoxnuCNCJK2iRholNIlZ5rwk7gbjssgVk+1qALHLTSUTWEkQgG4fDe+GXGRRgo4TF3.QYe6eFilir0eFalMA.4t+cgaWtHtj5e.oFyhDIFW1s468iXFykSr+cRlabsLlS4GclXpQAdrX2IpTz5tWpTlLLayq+6voKjI06G8s6zku8brG2f3N4f0Bbtm.pmbCcJWB6bUeCO4kLBDKQBycQOLg2En++Wyi9+wG8H2A68GVNVMahPiN1V00ufm6ewG8H2N64GVNlzUG8J0zYRyeAHRjH5S5Ci+wUcwb+KdYbCO8qvh+a2NYtw0gUSFQcngwXl67aU00vm5rYmq5a34m2jPtRUcXpabyoLvAhx9NrKZlbh8uKd4+zrIh36E0UQorfm60QpbEsnJMa+TA8.nOCZn7YO08fcqV45dhWDkpClzF6Do1yQI6lDiz6zOHVDz6nBiZLXBWtciZkxAfXCKTbdpdid5dU5wiGeAszpuARNtn3DkUMIDQnnyjkNceVftGzpDMy5qpbjoPIZBKhNSe5LhS61PeMZQS3QfBUA0pud2tbQ8UUAxTnzO0w0sKWX0rITFjZDKQBtc6FcUUAhkHtc837TekkgpfC4LpVucTDHJ6qI80iUSlHznhFoxUzjxNSpw7o6o2ouuuzW3wHogNBF2Uz9yEu4dfcSUEbR5cZCoIkEeDgxzFVpHVLDjBEr+7Jl8mawz2XhfqYBYfQq1op5MPI0pi8mawbMSHCjJQBe6NyjaZpig7qnFxt3J3JF6PQlDI3vkK9tceDuCi8hFMKYK6C.tjLFHYVPYM6VUojbxlX6W+IkN44dTfNdDTFXAZ0Tdd4v9W+pHyMtVd7k9iHWY6etFOSA45NfPPtyeoa+i0k.c+PQPZPlBk7Wdk2qCI.G3cwSPjH7zM7Qqyia2fHQd8QANuCgGPeAZ0DYBIxru86uC0lJCRMxUpDKFMPPgDVGpsauXtACHWoJTnTUWsqHPa.geZRftEDbjQilvif5qtBLoWWKt8fNWiQc0gdsURvQDAgFSbc0ti.sAD5Im.cKHznhwmX.Xr957IuQc0HWUPDZLwR3w0Keqls.megPPNA51Pr8MYTpVCFpo51kpxzQhbUAQ3wlPylmZE37CDBxIP2JBMpXHznhoq1MDnGDByIm.BHPOZDBxIf.BziFgfbBHf.8n4b1bxY0jQzqsZrZrqSJvEPfyJhDQPAGBpCObBJXgjVSOANmDjSu1pn1RKsaUplS.AZITpQCZBKRhpO8QXaizCfN8fbVLZjZKqDpqxxQklfI59Dc2hLwj.Bzb31kKLaPO0VdI.fL4JQUvc9hqf.cdzpCxYVuNLVecX4TC6TQPAglviD0gEdyJbhFpoZLVecnJ3PPSXc+xDSBHPiQrDInIbupriQc0fw5hnaaPtFpqFTGVDMQwXps7RHyMtVl1e9NOm3GGaWakcspul9j9voWoLHeutwh3ZfRK0lZODvVxkSGTY94h1RJxW.N.rY1L0VVITY94gKmNax0YyrIra1Dpzz87CJBHPyQPgDJ1LatcsojCVtDjKoyQDNOSoQS8Zqh8u9uqSodaN95W5II4LFMCdhS0uW2ZoyJ0fFP8jyiGOTcgdSlMsD1sXlZJsHhMo96+051cKlp45r3nadsDWJChHRzqXNZ2pExbs+ORZ3ikX5eZ31kKxeeaGsElKdb6lPiMdFzEMGeRrdVq+aI59kJwOvg5yl4u2sSPgGI31M4u+eoI0olHilzl7rX+qbI9cbUgDFCdZWFxaj9tU3g1EUWvIvoUqnJ3PXHWx7PlBuO72mXG+LgEehDSxo0hsO6lMwI221n9RKBQhkPLImJ8erdycEEbvchLEJIwAOB+tFi0TEmbuamgOm4i1hxib+ke1WYRUohTG+zIr37p1yUmeNj2t1RSp2ANkYRXwkH64a9X+NtRMgP5S6RQYijH9it40PxidRj0OtBFyUeK9NdU4dLJ9H6kgOmqk710lHjniiDGxukQsJ5v6AoxTPuR2a5MTWkkRwYtGLVWMfGOLvIMChrOd+LltJJkitoev20JSkJFzTlCZ5.lGsSmFBaqIb74Mv3nWgnBOd7vpOQUThg1mHc96SWjMNMZlXZCF8UWERjJEC0VMRjJuYswYJcc5srR8YiTF437ajYsT5rrvrODlzWOQDWuPW0U560gDYzXRuNx8.6FEAEDoLxKDox9M+p4RelMWpAsif.JxSC0VyYL.2owpQiXr9570c+tJLTc4DQB8A.bXyB6doe.wk5PHl96Mvw9W0WfBkp4BtTuh83w21FXyK90Yh2z8fhfTi9pJiJNd1DQhIghSI1kFqWKhkIk3RYvjppoC.Y9CKiTlvTQc3QhTYJwsaWnupxXzy+l84K0WRgr8O+sYJK7AQpL4bzsrNzWYoLrYdknPcvj2t2Ba58eUlvBtKzDYLzPMUgxyhJbbjeZUHBXTW4eF6VLSlq4qwsSGjxDlNlpSayJPm1sYE8U484A0tIi3wiGF3jmg26QVrvA9tufzl7LoWomAVMYDQhESJSv+eMVSDwfaWtntRKfK7F9sLWlgJqfs+e+OLkE9PHWoJb5vN5qrb.ntRJz24Uc94PV+32xXt1EhbkpPeUkSQGZ2DYeRFUg3cpLLUecH+Tp8g9pJm88seNCYZWJCaVWMUexbHy0tb58PFAoNwYfCaVvgUyL3Yb4.dmJkc9UuGS9Ve.+B3dtl9GtZ5cnp3yxrDFahgyj5SD7UYWVaxVtc6lO9wVDlzqijFRFrrW8Y35ex+IEerr.7lFMEIVDK6UdF7.Djlf4Ru6GqYsUUEkOK4Ye.TpNXRZHYPVacCL4q4lX527cQkEjGewy8P9rw899eiOYzxoca7QO1cgcKloWoLHV9+umiK8u9HL5YOOxbiqE2tbwA+40fDoR88ZDIlu80edtfoMaLpqdV9q824Q97UihfTy+8ouOzosJ5cZCgU9lu.W989DjwTmkeoFz9N3gctMHm4FzGvFrg5p8LFjyr9ZogpqFOdbi1BykvSn299kbCUWAk9qGDckWBwkZ5j7nmLtc4jhO7dIrD5Kkj09PUvgRxiYRHVhTb4zAGe6+D5JuXhI4TI4wNE+VTCm1swd9lOh3G3PIkw6M85U1QyDmVrvXtpeKPzvmy7IqebEj2d1BC9hmK.DbzwQVaXkL5q7l7y+UpIDeeARhbYDRLIP3w68W0rZz.hDKln5yuk0whpOCfBOztwrt5viGOT9QyjK9N9a9x2CoM4YhhfzvQ27ZXLy+VCn6w0VR9LwErHjGjZjGjZF47V.U+6ReimMjoRke9oTkp3vqYYjPZd+kcEAowuxOMNrY0W6xu13g2CFqoJhHwjnthymn+c8nWag4RVqeEL1qcgDRiTZ4PiKQxbMKmwcCMMcOl05WNCcFWAwk5fAfX5eZLw36Ma58eY58vGiW+Vg+siRN79vXsU2kFjKV0xwjcWzfcmTQCVI8nzfXQf61vlJ3n6XyMa5hbVK7d8kFMKK2iQcUVN+i0raTGZXj+g2eKZulKccN8a9t.vOazXNSoyx4c+OE6XkKkq5AeFBIxnIqsrAtpG7YHyMtV5a5Ciq39dRDIRD6bkKEKFMPN6Y6sX5y7Rtk61uTCZGEAzbxY2Rf2U6S+kfVBS0WGGd8KC6VLQroLHxYaa.CUWAVMZf8t7OkDRa3j1TlIk8qGhRx9.3wiGN1VVKUb7rH9zFBZKLOJNKuxU8dW9mgHIhYfSZFTeEkPNMJYy3zgM1827wDZb81W.N.ps3SRzI0zu7F+.GJ0UTd9d+.m7kPCZqhxN1gC31N3c340Tbd99Kms8i.dG1ZcEmOQ16jZRBsI9zFF0V7IC35HoK3BY6e96vQ27ZolhyCIRkSeyXrsJ+72Sz8c.3vpYrZx67sZPaEbhe4m76uFKnkMtMl2t1LNLaBMQ3cXhUcxbH5FMb6ZK9jbfUtDF0UdS9EfCfALtKB6VMQwGdu9cbu8FrLhpeo32wUDjZhrOISskjO.XwP897uiss0iKG1Hz3Rrccun8hTwhw4o1lTtNUjMohaayMWyktHmyc7.M47hL9d0jfSMGMW557rYiyT5rrkXnSd5T5w+U9+txov+6UdFBOtDH7XSfRyIaeoOyO5QtS9g280ZR5yril.dN4BTBjyM3nim9bpeINpjF.FpoRhIoTYLy+VQUngg9pJifiJNrepI80iGOj1jlIhDKFy50g9xKA8UUNNrXhAM4YA3sGA+767hj1j8lPny9m+dhru8mJNQ1j5DmgubdfKG1QphlJ9gxTnD619srQkDIxHi4bMr+U94DceaZPwVB2tbxI1t246p9xKldOjQvXutaCYJThKG1PRyzEboxkiKGNvsqltvMMGoNgoSL8ePT9wxjis40gYc0wPtj4QuFzvCX+r4PhTo3pQ2CNSz31XBCZ3L1q617MuiFptBBIl3wloFvkC6j4ZWNgDSBTRV6ivh2+.PhDKgLl60wtW5GRzIOPeG2kC6fHQM6PVjJSANsYEEAowuiaUuNrZz.NsaqCI8O1VwoG2H4TymkjSEbyYaoabPKltHiHN+yVdhBvskUyktNOa13LkNKaIBOtdwSu7MwIybebh8sC97m8A4pdnmMfRelczDPA4jISNNrGXe3Wl7yd2LkH+29fqXwh8IuzYs9UfXIhQUHgiEC5PSTdyFWRjJ2mzSKVjH73wM1sZF4M5C4Rkq.O.tO0J7lzHFOoM4YRVq+aIy09+XrmZnfx0DBVLZnI9jEC5P0uaGtGQhIQuROCx9mVERCPY9VhL4L9az6+.K8WOHGeaafALtK1WcWaYE0jqwZC5QdPp8svGmIrZz.Uk2wnuYLVeKTf9pJmc+0Kl3O0v5ZK3ztMbXyFJBNDnBHjnimTWxYFOw..fALlDQAQk3LZwy+zswpx8Xj0O9sjxE5sMZptZHnvhv2jVKRrHF60bqHWkZ1xG+uH59kpugedZBMl3IoQNdN7ZWFgDq21jLEJQjXIX0nglLzSKMnGkZ79+JUgDte9Yt63mI2c7yLrYc0s46EsWpwjcFY7RHX4RIdMJnFy1aSCUEfjG9nXou3iiMKlQgpfXeqakb3MsNVza8Y9Rilc1z+LFM+v685bI2xcihfT6W5rrkXiK4CvPMUyU9fOCoLxKDcZqh5JuDRNiQy9W+2QjIjHpzDBkk6w3idj6jm7a9I+RMnmyGtp5vC782l5vZaRWcIYsOTGQTL9a7t3BtrqGkAGxY7IiPklPvTc0fa2d+UNKMnGwhk3anfgcpurj9ztLLVqVJ3f6D.RZ3ikx90CgwZq1msbZyJ4sqMQ+Fw3ZR8j1TlM0WQInsUNmW.j3fGAQmbpj8oVAvDRcHXrlpQag456bb6xIGaqqijFw3CHaJVpLxYaqGqMJPsB0ZviaWmgq5rS96caDURCnU2CnXSYPzqgLRxZCqDv6PUO8B7.fXIxPSjwf7fTSFy8Z3vqa4XoYli2TF2EicyFohSM8.hkHkjFw3HmsrN+NuJOwuhUSMPLImZy5O1sZtYO94RxsNSTpAqbqYzaRMRMr8hqqMaqFmtH+2K55Yye4h81inFkFMqqx11hZDnLrKZlj5nGOu7eZ17etqafu5EdTeoyxVhQOmqhb16N30u04warvqlJO4wYby6F7K8Y9etqaf269tYl6hdXjoPgesopJJ+NL+Of5IWvQFMlpu9yZu4jJWFpaia32PhMAJ7P6lS7K+D1LahZKNeTcFR8gZhLFhr28iCrpujPiNdp5j4PpSZFMIYiHUlbF4keCrqk9gDQh8iPiIdF5kLO10R+PhKkAiDEJohicXhteoPbo1zLEkDox3Btzqkc9kueapck1jmEa9CeMpJ2iQroLHF0U9mYuK+SI5jRgfBMbJOmrPYvgR+F0D8cMmbOagRy52l73AO8KmPOU24kqTE8aDimM9duLgepUP1jt5H0ILCe8DrnCuO+VHhTlvzZxvj0UVQ9ZSVMaD4JTQFy8Z8UdMEmWSZy8Y3ilXSoo8VL0wOU1zG9ZT5udPponbIiK85a16EwjbZjvfFNG56WJi6FtC+JSrDoLrYeMrik719N1flxrX+e2Wv1+r2hXGP5Xp9Zn1RJjgOm46qsZPaE97S6VLgKmNYzWk+KVz4Z7.rxbpffkKAatbicWsuGiwq39dBl9MunljtHefEubeoQyQL84567Sd3ihG6KWWSrSeSeX7T+ueaqC0mAMLdpksQ.HogjAO42zxIP84+2dNl8se+Ma5r701R1M6qerubsnu5JviGH73RvWu6uh66IXF2xesYSelMtM0QQ.mRBsayJZKJebZu42ndhkHgXSNEj+65lYQYeXppfSRr8yaWasa0BVMny2DParVsHSoRTnNXLVqVrZROAEZ3HUlRra1HpiHZpq7hHxSsm2rYpAbX0pu8BUME6cwBBIp38MmP5qtBToID+1aZ5qpbjHUluqytUKXnZu+BnlHhEkMZyJqqxxPc3Q5WuZpuhRPUvg86NuRQSD+1+vc6xE0WQw970SiwZqF2tcSHQ6MGA3xoSpu7BA.UZBC0Q7apNqwZpBql8WDCBIld4aaUzXaZ0j2dyoLnf8MzdS0WCVZPmemavQEGRjHkFpSKgGeuwlYizPMUB.hEKw29I7zX0nALVW076InPi.kAGJ0WZg91qZmFS0WCNc3.Otc6aXzM28CWNcP8kWDgEahXRe8nJjv7qsoupxQdPAgpf+sQDnu5JvgUSHRjXhr2I663M9+g.DVb89L16hVKm9ys8cHsu45TftVZU4cUWNcRC0UKl0qy2pnJUgRzDVXnI7Ha1M7aQ+ZVTUAmjX5SRBozMANuAOtcS0EWn2fbCdXc0ti.sCZUOFBRjJkvhIVBKlXC3qQgJUHWoRrY1je8BR.A5NiUSlPtRUHuKbUZEnigN8tVoNrHPS3Qfg5pAKMzP2lTMm.BzRX1fdLVesDbDQPvBIvly6oS+AJM3HhDaV7thWFqudLTSSmqGADn6DxUEDgEabDRzw1k+HJJP6myIO07Q0qdiBUAg5vpC6V55WheAD3LgTEJIznhAMshsNk.ce4blzfDbDQRvQD44ppS.ADP..gDYi.BHPObDBxIf.BziFgfbBHf.8nQHHm.BHPOZDBxIf.BziFgfbBHf.8n4+OA9q1UKSf2rN.....IUjSD4pPfIH" ],
									"embed" : 1,
									"id" : "obj-4",
									"maxclass" : "fpic",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "jit_matrix" ],
									"patching_rect" : [ 206.0, 118.0, 306.0, 83.0 ],
									"pic" : "HCHD:/Users/hcg/Desktop/vpt6_images/vpt6_midi.png"
								}

							}
, 							{
								"box" : 								{
									"angle" : 0.0,
									"background" : 1,
									"bgcolor" : [ 0.827451, 0.827451, 0.827451, 1.0 ],
									"id" : "obj-20",
									"maxclass" : "panel",
									"mode" : 0,
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 1.0, 1.0, 870.0, 314.0 ],
									"proportion" : 0.39,
									"style" : ""
								}

							}
 ],
						"lines" : [ 							{
								"patchline" : 								{
									"destination" : [ "obj-9", 0 ],
									"source" : [ "obj-11", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-25", 0 ],
									"source" : [ "obj-24", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-26", 0 ],
									"source" : [ "obj-27", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-30", 0 ],
									"source" : [ "obj-31", 0 ]
								}

							}
, 							{
								"patchline" : 								{
									"destination" : [ "obj-34", 0 ],
									"source" : [ "obj-35", 0 ]
								}

							}
 ]
					}
,
					"patching_rect" : [ 165.0, 97.0, 37.0, 20.0 ],
					"saved_object_attributes" : 					{
						"description" : "",
						"digest" : "",
						"globalpatchername" : "",
						"style" : "",
						"tags" : ""
					}
,
					"style" : "",
					"text" : "p midi"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-96",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 165.0, 75.0, 46.0, 20.0 ],
					"style" : "",
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"bgoncolor" : [ 1.0, 1.0, 0.0, 1.0 ],
					"fontname" : "Arial Bold",
					"id" : "obj-97",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 165.0, 27.0, 50.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 295.5, 11.0, 21.0, 17.0 ],
					"style" : "",
					"text" : "?",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"texton" : "delete",
					"textoncolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"tosymbol" : 0,
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-43",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 122.0, 192.0, 89.0, 22.0 ],
					"style" : "",
					"text" : "s midibutmode"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgoncolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontsize" : 10.0,
					"hint" : "",
					"id" : "obj-208",
					"legacytextcolor" : 1,
					"maxclass" : "textbutton",
					"mode" : 1,
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"outputmode" : 0,
					"parameter_enable" : 0,
					"patching_rect" : [ 122.0, 163.0, 39.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 165.0, 39.0, 42.0, 19.0 ],
					"rounded" : 8.0,
					"style" : "",
					"text" : "button",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"texton" : "toggle",
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textovercolor" : [ 0.1, 0.1, 0.1, 1.0 ],
					"usebgoncolor" : 1,
					"usetextovercolor" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-11",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 552.0, 338.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "i"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 441.0, 217.0, 87.0, 22.0 ],
					"style" : "",
					"text" : "r midibutmode"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-19",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 587.0, 271.0, 36.0, 22.0 ],
					"style" : "",
					"text" : "sel 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-21",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 500.0, 247.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "+ 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-31",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 552.0, 247.0, 54.0, 22.0 ],
					"style" : "",
					"text" : "gate 2 1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-35",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 587.0, 299.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-47",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 458.0, 456.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-46",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 455.0, 410.0, 27.0, 22.0 ],
					"style" : "",
					"text" : "r lb"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-45",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 642.0, 415.0, 92.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 227.0, 62.0, 72.0, 20.0 ],
					"style" : "",
					"text" : "ctrl nr offset"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "control number offset for midi",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-194",
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"outputonclick" : 1,
					"parameter_enable" : 0,
					"patching_rect" : [ 587.0, 415.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 203.666016, 62.0, 35.0, 20.0 ],
					"prototypename" : "vpt_int2",
					"style" : "",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"tricolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"varname" : "ctrl_offset"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-42",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 587.0, 450.0, 78.0, 22.0 ],
					"style" : "",
					"text" : "s midi_offset"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-41",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 801.0, 582.0, 59.0, 22.0 ],
					"style" : "",
					"text" : "pack 0 0."
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-40",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 815.0, 462.0, 76.0, 22.0 ],
					"style" : "",
					"text" : "r midi_offset"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-38",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 801.0, 487.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "+ 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-37",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "int", "int" ],
					"patching_rect" : [ 801.0, 434.0, 69.0, 22.0 ],
					"style" : "",
					"text" : "unpack 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-36",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 639.0, 569.0, 50.0, 22.0 ],
					"style" : "",
					"text" : "5 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-29",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 636.0, 25.0, 39.0, 22.0 ],
					"style" : "",
					"text" : "* 127"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-28",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 636.0, 1.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-17",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 592.0, 57.0, 63.0, 22.0 ],
					"style" : "",
					"text" : "pak 5 127"
				}

			}
, 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-4",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "softmidi-vpt7_01.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 146.0, 231.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 25.0, 89.0, 243.0, 312.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-94",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 572.0, 148.0, 24.0, 22.0 ],
					"style" : "",
					"text" : "t 0"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"blinkcolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"hint" : "rescan midi bus",
					"id" : "obj-93",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"outlinecolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"patching_rect" : [ 588.0, 115.0, 20.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 61.0, 20.0, 20.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-33",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 454.0, 89.0, 50.0, 21.0 ],
					"style" : "",
					"text" : "midiinfo"
				}

			}
, 			{
				"box" : 				{
					"allowdrag" : 0,
					"arrow" : 0,
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_angle" : 270.0,
					"bgfillcolor_color" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"bgfillcolor_color1" : [ 0.376471, 0.384314, 0.4, 1.0 ],
					"bgfillcolor_color2" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
					"bgfillcolor_proportion" : 0.39,
					"bgfillcolor_type" : "color",
					"fontsize" : 11.0,
					"hint" : "choose midi input device",
					"id" : "obj-90",
					"items" : [ "to Max 1", ",", "to Max 2" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 454.0, 113.0, 91.0, 21.0 ],
					"pattrmode" : 1,
					"presentation" : 1,
					"presentation_rect" : [ 27.0, 62.0, 177.0, 21.0 ],
					"style" : "",
					"textcolor" : [ 0.149, 0.149, 0.149, 1.0 ],
					"varname" : "mididevice"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 11.595187,
					"id" : "obj-91",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 454.0, 60.0, 70.0, 21.0 ],
					"style" : "",
					"text" : "loadmess 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 801.0, 615.0, 39.0, 22.0 ],
					"style" : "",
					"text" : "zl rev"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 983.0, 355.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "+ 1"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 4,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 829.0, 402.0, 59.5, 22.0 ],
					"style" : "",
					"text" : "switch 3"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 801.0, 651.0, 68.0, 22.0 ],
					"style" : "",
					"text" : "s to_router"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "int" ],
					"patching_rect" : [ 686.0, 335.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "t b i"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 663.0, 360.0, 56.0, 22.0 ],
					"style" : "",
					"text" : "pack 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-34",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 753.0, 316.0, 39.0, 22.0 ],
					"style" : "",
					"text" : "* 127"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 753.0, 266.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "> 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "int", "int" ],
					"patching_rect" : [ 752.0, 242.0, 50.0, 22.0 ],
					"style" : "",
					"text" : "change"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-10",
					"linecount" : 2,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 667.0, 197.0, 40.0, 33.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 106.0, 37.0, 54.0, 20.0 ],
					"style" : "",
					"text" : "velocity"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-30",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 666.0, 176.0, 74.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 29.0, 37.0, 55.0, 20.0 ],
					"style" : "",
					"text" : "midinote"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "select type of incoming midi data",
					"htabcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"id" : "obj-25",
					"maxclass" : "tab",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 983.0, 212.0, 122.0, 100.0 ],
					"style" : "",
					"tabcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"tabs" : [ "cc", "channel", "noteon" ],
					"textcolor" : [ 0.15, 0.15, 0.15, 1.0 ],
					"varname" : "tab"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-22",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 687.0, 129.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 85.0, 39.0, 28.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"varname" : "velocity"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-23",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 634.0, 130.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 39.0, 28.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"varname" : "midinote"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-24",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "int", "int" ],
					"patching_rect" : [ 634.0, 102.0, 62.0, 20.0 ],
					"style" : "",
					"text" : "unpack 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-12",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "int" ],
					"patching_rect" : [ 906.0, 181.0, 32.5, 22.0 ],
					"style" : "",
					"text" : "t b i"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-14",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 906.0, 218.0, 56.0, 22.0 ],
					"style" : "",
					"text" : "pack 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-15",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 927.0, 129.0, 40.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 106.0, 19.0, 40.0, 20.0 ],
					"style" : "",
					"text" : "value"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-16",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 864.0, 130.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 85.0, 21.0, 31.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"varname" : "value"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-18",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 740.0, 193.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 22.0, 34.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"varname" : "cc"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"fontname" : "Arial Bold",
					"fontsize" : 10.0,
					"hint" : "",
					"htricolor" : [ 1.0, 0.0, 0.0, 1.0 ],
					"id" : "obj-20",
					"ignoreclick" : 1,
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 773.0, 68.0, 48.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 4.0, 31.0, 20.0 ],
					"style" : "",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"triangle" : 0,
					"tricolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"varname" : "midichannel"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-26",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 927.0, 107.0, 40.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 29.0, 19.0, 22.0, 20.0 ],
					"style" : "",
					"text" : "cc"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-27",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 926.0, 86.0, 74.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 29.0, 2.0, 74.0, 20.0 ],
					"style" : "",
					"text" : "midichannel"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"id" : "obj-75",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "int", "int" ],
					"patching_rect" : [ 740.0, 165.0, 62.0, 20.0 ],
					"style" : "",
					"text" : "unpack 0 0"
				}

			}
, 			{
				"box" : 				{
					"fontname" : "Arial",
					"fontsize" : 9.0,
					"id" : "obj-104",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 8,
					"outlettype" : [ "", "", "", "int", "int", "", "int", "" ],
					"patching_rect" : [ 700.0, 46.0, 92.0, 19.0 ],
					"style" : "",
					"text" : "midiparse"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"color" : [ 0.094118, 0.113725, 0.137255, 0.25098 ],
					"fontname" : "Arial",
					"fontsize" : 10.0,
					"hint" : "doubleclick to select port",
					"id" : "obj-105",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 700.0, 24.0, 47.0, 20.0 ],
					"style" : "",
					"text" : "midiin a",
					"textcolor" : [ 0.0, 0.0, 0.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"angle" : 0.0,
					"background" : 1,
					"bgcolor" : [ 0.568627, 0.788235, 0.870588, 1.0 ],
					"id" : "obj-39",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1019.0, 507.0, 128.0, 128.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 0.0, 328.0, 418.0 ],
					"proportion" : 0.39,
					"rounded" : 0,
					"style" : ""
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 0 ],
					"source" : [ "obj-1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-20", 0 ],
					"source" : [ "obj-104", 6 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"source" : [ "obj-104", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-37", 0 ],
					"order" : 0,
					"source" : [ "obj-104", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-75", 0 ],
					"order" : 1,
					"source" : [ "obj-104", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-104", 0 ],
					"source" : [ "obj-105", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-34", 0 ],
					"source" : [ "obj-11", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-14", 1 ],
					"source" : [ "obj-12", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-14", 0 ],
					"source" : [ "obj-12", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-21", 0 ],
					"source" : [ "obj-13", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-3", 2 ],
					"midpoints" : [ 915.5, 324.0, 865.5, 324.0 ],
					"source" : [ "obj-14", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"source" : [ "obj-17", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-35", 0 ],
					"source" : [ "obj-19", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-42", 0 ],
					"source" : [ "obj-194", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-3", 0 ],
					"midpoints" : [ 992.5, 384.0, 838.5, 384.0 ],
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-14", 0 ],
					"source" : [ "obj-20", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-43", 0 ],
					"source" : [ "obj-208", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-31", 0 ],
					"source" : [ "obj-21", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-22", 0 ],
					"order" : 1,
					"source" : [ "obj-24", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-23", 0 ],
					"order" : 1,
					"source" : [ "obj-24", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-7", 0 ],
					"order" : 0,
					"source" : [ "obj-24", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"order" : 0,
					"source" : [ "obj-24", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-2", 0 ],
					"order" : 1,
					"source" : [ "obj-25", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-55", 0 ],
					"order" : 0,
					"source" : [ "obj-25", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-29", 0 ],
					"source" : [ "obj-28", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-17", 1 ],
					"source" : [ "obj-29", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"source" : [ "obj-31", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-19", 0 ],
					"source" : [ "obj-31", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-41", 1 ],
					"source" : [ "obj-32", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-90", 0 ],
					"source" : [ "obj-33", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-6", 0 ],
					"source" : [ "obj-34", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-11", 0 ],
					"source" : [ "obj-35", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-32", 0 ],
					"source" : [ "obj-37", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-38", 0 ],
					"source" : [ "obj-37", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-41", 0 ],
					"source" : [ "obj-38", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-38", 1 ],
					"source" : [ "obj-40", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-1", 0 ],
					"source" : [ "obj-41", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-47", 0 ],
					"source" : [ "obj-46", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-194", 0 ],
					"source" : [ "obj-47", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-50", 0 ],
					"source" : [ "obj-48", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-49", 0 ],
					"source" : [ "obj-50", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-48", 0 ],
					"source" : [ "obj-51", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-90", 0 ],
					"source" : [ "obj-53", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-25", 0 ],
					"source" : [ "obj-54", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-7", 1 ],
					"source" : [ "obj-6", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-37", 0 ],
					"midpoints" : [ 672.5, 386.0, 810.5, 386.0 ],
					"source" : [ "obj-7", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 0 ],
					"order" : 0,
					"source" : [ "obj-75", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-16", 0 ],
					"order" : 1,
					"source" : [ "obj-75", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-18", 0 ],
					"source" : [ "obj-75", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-31", 1 ],
					"source" : [ "obj-8", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-8", 0 ],
					"source" : [ "obj-9", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-105", 0 ],
					"source" : [ "obj-90", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-52", 0 ],
					"source" : [ "obj-90", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-33", 1 ],
					"midpoints" : [ 463.5, 84.0, 494.5, 84.0 ],
					"source" : [ "obj-91", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-96", 0 ],
					"source" : [ "obj-92", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-94", 0 ],
					"source" : [ "obj-93", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-33", 1 ],
					"source" : [ "obj-94", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-95", 0 ],
					"source" : [ "obj-96", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-92", 0 ],
					"source" : [ "obj-97", 0 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "softmidi-vpt7_01.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "softslider-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "softbutton-vpt7.maxpat",
				"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers",
				"patcherrelativepath" : ".",
				"type" : "JSON",
				"implicit" : 1
			}
 ],
		"autosave" : 0
	}

}
