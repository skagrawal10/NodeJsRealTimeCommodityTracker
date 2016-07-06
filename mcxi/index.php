<body style="background: #000000; color : #FFFFFF;">

<?php
	$data = file_get_contents('http://www.indiamarketwatch.com/IndiaMarketWatch/M1/JSON2x3/JSONMobile.aspx?username=muskan241&ScriptView=Standard');
	$json = json_decode ($data, true);
	echo '<table width="95%" style="font-size : 34px; font-weight: bold;" border="2">';
	foreach ($json["AllRows"] as $row){
		if (substr($row['SymbolName'], 0, 6) == 'SILVER')
			echo '<tr style="background: #777777;">';
		else
			echo '<tr>';
		echo '<td>' . $row['SymbolName'] . '</td>';
		echo '<td>' . $row['MyColumn'][0]['Value'] . '</td>';
		echo '<td>' . $row['MyColumn'][1]['Value'] . '</td>';
		echo '<td>' . $row['MyColumn'][2]['Value'] . '</td>';
		echo '<td>' . $row['MyColumn'][3]['Value'] . '</td>';
		echo '<td>' . $row['MyColumn'][4]['Value'] . '</td>';
		echo '<td>' . $row['MyColumn'][5]['Value'] . '</td>';
		echo '<td>' . $row['MyColumn'][6]['Value'] . '</td>';
		echo '</tr>';
	}
	echo '</table>';
?>

</body>