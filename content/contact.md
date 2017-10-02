+++
title = "Contact Us"
date = "2014-04-09"
menu = "main"
weight = 11
+++
<style >
	@import url(https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,200,200italic,300,300italic,400italic,600,600italic,700,700italic,900,900italic);

body {
    font-family: 'Source Sans Pro', sans-serif;
    line-height: 1.5;
    color: #323232;
    font-size: 15px;
    font-weight: 400;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-font-smoothing: antialiased;
}
table, th, td {
	border: none !important;
}
.heading-title {
    margin-bottom: 100px;
}
.text-center {
    text-align: center;
}
.heading-title h3 {
    margin-bottom: 0;
    letter-spacing: 2px;
    font-weight: normal;
}
.p-top-30 {
    padding-top: 30px;
}
.half-txt {
    width: 60%;
    margin: 0 auto;
    display: inline-block;
    line-height: 25px;
    color: #7e7e7e;
}
.text-uppercase {
    text-transform: uppercase;
}

.team-member, .team-member .team-img {
    position: absolute;
}
.team-member {
    overflow: hidden;
}
.team-member, .team-member .team-img {
    position: relative;

}

.team-hover {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: 0;
    border: 20px solid rgba(0, 0, 0, 0.1);
    background-color: rgba(255, 255, 255, 0.90);
    opacity: 0;
    -webkit-transition: all 0.3s;
    transition: all 0.3s;
}
.team-member:hover .team-hover .desk {
    top: 35%;
}
.team-member:hover .team-hover, .team-member:hover .team-hover .desk, .team-member:hover .team-hover .s-link {
    opacity: 1;
}

.team-hover .desk {
    position: absolute;
    top: 0%;
    width: 100%;
    opacity: 0;
    -webkit-transform: translateY(-55%);
    -ms-transform: translateY(-55%);
    transform: translateY(-55%);
    -webkit-transition: all 0.3s 0.2s;
    transition: all 0.3s 0.2s;
    padding: 0 20px;
}
.desk, .desk h4, .team-hover .s-link a {
    text-align: center;
    color: #222;
}
.team-member:hover .team-hover .s-link {
    bottom: 10%;
}
.team-member:hover .team-hover, .team-member:hover .team-hover .desk, .team-member:hover .team-hover .s-link {
    opacity: 1;
}
.team-hover .s-link {
    position: absolute;
    bottom: 0;
    width: 100%;
    opacity: 0;
    text-align: center;
    -webkit-transform: translateY(45%);
    -ms-transform: translateY(45%);
    transform: translateY(45%);
    -webkit-transition: all 0.3s 0.2s;
    transition: all 0.3s 0.2s;
    font-size: 35px;
}
.desk, .desk h4, .team-hover .s-link a {
    text-align: center;
    color: #222;
}
.team-member .s-link a {
    margin: 0 10px;
    color: #333;
    font-size: 16px;
}
.team-title {
    position: static;
    padding: 20px 0;
    display: inline-block;
    letter-spacing: 2px;
    width: 100%;
}
.team-title h5 {
    margin-bottom: 0px;
    display: block;
    text-transform: uppercase;
}
.team-title span {
    font-size: 12px;
    text-transform: uppercase;
    color: #a5a5a5;
    letter-spacing: 1px;
}

</style>
<div class="container">
                    <div>
                        <div class="heading-title text-center">
                            <h1 class="text-uppercase">Our Team</h1>
                        </div>
                        <table>
                        	<th>
                        		<td class="col-md-4 col-sm-4">
		                            <div class="team-member">
		                                <div class="team-img">
		                                    <img src="/images/1.jpg" alt="team member" class="img-responsive">
		                                </div>
		                                <div class="team-hover">
		                                    <div class="s-link">
		                                        <a href="#"><i class="fa fa-facebook"></i></a>
		                                        <a href="#"><i class="fa fa-twitter"></i></a>
		                                        <a href="#"><i class="fa fa-google-plus"></i></a>
		                                    </div>
		                                </div>
		                            </div>
		                            <div class="team-title">
		                                <h5 class="text-center">Jaskirat Singh</h5>
                                        <p class="text-center">UG Coordinator</p>
		                            </div>
		                        </td>
		                        <td class="col-md-4 col-sm-4">
		                            <div class="team-member">
		                                <div class="team-img">
		                                    <img src="/images/2.jpg" alt="team member" class="img-responsive">
		                                </div>
		                                <div class="team-hover">
		                                    <div class="s-link">
		                                        <a href="#"><i class="fa fa-facebook"></i></a>
		                                        <a href="#"><i class="fa fa-twitter"></i></a>
		                                        <a href="#"><i class="fa fa-google-plus"></i></a>
		                                    </div>
		                                </div>
		                            </div>
		                            <div class="team-title">
		                                <h5 class="text-center">Prakhar Agarwal</h5>
                                        <p class="text-center">UG Coordinator</p>
		                            </div>
		                        </td>
		                        <td class="col-md-4 col-sm-4">
		                            <div class="team-member">
		                                <div class="team-img">
		                                    <img src="/images/3.jpg" class="img-responsive">
		                                </div>
		                                <div class="team-hover">
		                                    <div class="s-link">
		                                        <a href="#"><i class="fa fa-facebook"></i></a>
		                                        <a href="#"><i class="fa fa-twitter"></i></a>
		                                        <a href="#"><i class="fa fa-google-plus"></i></a>
		                                    </div>
		                                </div>
		                            </div>
		                            <div class="team-title">
		                                <h5 class="text-center">Linda Anderson</h5>
		                                <p class="text-center">UG Coordinator</p>
									</div>
		                        </td>
                        	</th>
                        </table>
                         <center>
                            <table>
		                        <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                </td>                                
                                <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                </td>
                                <td class="col-md-8 col-sm-8">
                                    <div class="team-member">
                                            <div class="team-img" >
                                                <img src="/images/4.jpg" alt="team member" class="img-responsive" height="400px" width="400px" align="middle">
                                            </div>                                        
                                        <div class="team-hover">
                                            <div class="s-link">
                                                <a href="#"><i class="fa fa-facebook"></i></a>
                                                <a href="#"><i class="fa fa-twitter"></i></a>
                                                <a href="#"><i class="fa fa-google-plus"></i></a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="team-title">
                                        <h5 class="text-center">Rajat Mittal</h5>
                                        <p class="text-center">Faculty Incharge</p>
                                    </div>
                                </td>                        	
                            </table>
                        </center>                                 
                    </div>
</div> 
